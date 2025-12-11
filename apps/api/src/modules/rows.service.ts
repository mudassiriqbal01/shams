import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Row } from '../database/entities/row.entity';
import { Module } from '../database/entities/module.entity';
import { Column, ColumnType } from '../database/entities/column.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { CreateRowDto } from './dto/create-row.dto';
import { UpdateRowDto } from './dto/update-row.dto';
import { FormulaEngine } from '../formula/formula.engine';

@Injectable()
export class RowsService {
  constructor(
    @InjectRepository(Row)
    private rowRepository: Repository<Row>,
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
    @InjectRepository(Column)
    private columnRepository: Repository<Column>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private formulaEngine: FormulaEngine,
  ) {}

  async create(
    moduleId: string,
    departmentId: string,
    createRowDto: CreateRowDto,
    userId: string,
  ): Promise<Row> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId, departmentId },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    const columns = await this.columnRepository.find({
      where: { moduleId },
    });

    const values = await this.processAndValidateValues(
      createRowDto.values,
      columns,
    );

    const row = this.rowRepository.create({
      moduleId,
      createdById: userId,
      values,
      version: 1,
    });

    const savedRow = await this.rowRepository.save(row);

    await this.auditLogRepository.save({
      entityType: 'Row',
      entityId: savedRow.id,
      action: 'CREATE',
      userId,
      departmentId,
      changes: { created: true, rowId: savedRow.id },
    });

    return this.enrichRowWithCalculatedColumns(savedRow, columns);
  }

  async findOne(
    id: string,
    moduleId: string,
    departmentId: string,
  ): Promise<Row> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId, departmentId },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    const row = await this.rowRepository.findOne({
      where: { id, moduleId },
    });

    if (!row) {
      throw new NotFoundException('Row not found');
    }

    const columns = await this.columnRepository.find({
      where: { moduleId },
    });

    return this.enrichRowWithCalculatedColumns(row, columns);
  }

  async findAll(moduleId: string, departmentId: string): Promise<Row[]> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId, departmentId },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    const columns = await this.columnRepository.find({
      where: { moduleId },
    });

    const rows = await this.rowRepository.find({
      where: { moduleId },
      order: { createdAt: 'DESC' },
    });

    return rows.map((row) =>
      this.enrichRowWithCalculatedColumns(row, columns),
    );
  }

  async update(
    id: string,
    moduleId: string,
    departmentId: string,
    updateRowDto: UpdateRowDto,
    userId: string,
  ): Promise<Row> {
    const row = await this.findOne(id, moduleId, departmentId);

    if (updateRowDto.version !== row.version) {
      throw new ConflictException('Version mismatch - data has been modified');
    }

    const columns = await this.columnRepository.find({
      where: { moduleId },
    });

    const values = await this.processAndValidateValues(
      updateRowDto.values,
      columns,
    );

    const oldValues = { ...row.values };
    row.values = values;
    row.updatedById = userId;
    row.version += 1;

    const updatedRow = await this.rowRepository.save(row);

    await this.auditLogRepository.save({
      entityType: 'Row',
      entityId: id,
      action: 'UPDATE',
      userId,
      departmentId,
      changes: { values: { old: oldValues, new: values } },
    });

    return this.enrichRowWithCalculatedColumns(updatedRow, columns);
  }

  async delete(
    id: string,
    moduleId: string,
    departmentId: string,
    userId: string,
  ): Promise<void> {
    const row = await this.findOne(id, moduleId, departmentId);

    await this.auditLogRepository.save({
      entityType: 'Row',
      entityId: id,
      action: 'DELETE',
      userId,
      departmentId,
      changes: { deleted: true, rowId: id },
    });

    await this.rowRepository.remove(row);
  }

  private async processAndValidateValues(
    values: Record<string, unknown>,
    columns: Column[],
  ): Promise<Record<string, unknown>> {
    const processed: Record<string, unknown> = {};

    for (const column of columns) {
      if (column.type === ColumnType.FORMULA) {
        continue;
      }

      if (!(column.id in values)) {
        if (column.isRequired) {
          throw new BadRequestException(
            `Column "${column.name}" is required`,
          );
        }
        continue;
      }

      const value = values[column.id];

      if (column.type === ColumnType.NUMBER) {
        if (typeof value !== 'number' && value !== null && value !== undefined) {
          throw new BadRequestException(
            `Column "${column.name}" must be a number`,
          );
        }
      } else if (column.type === ColumnType.DATE) {
        if (value !== null && value !== undefined) {
          const dateStr = String(value);
          if (!/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
            throw new BadRequestException(
              `Column "${column.name}" must be a valid date`,
            );
          }
        }
      }

      processed[column.id] = value;
    }

    return processed;
  }

  private enrichRowWithCalculatedColumns(
    row: Row,
    columns: Column[],
  ): Row {
    const enriched = { ...row };
    const context = { ...row.values };

    const formulaColumns = columns.filter(
      (c) => c.type === ColumnType.FORMULA,
    );

    const formulaMap = new Map(
      formulaColumns.map((c) => ({
        columnId: c.id,
        formula: c.formula || '',
      })).filter((f) => f.formula),
    );

    if (formulaMap.size > 0) {
      try {
        const order = this.formulaEngine.resolveFormulaOrder(
          new Map(
            Array.from(formulaMap).map(([id, formula]) => [
              id,
              { formula, columnId: id },
            ]),
          ),
        );

        for (const columnId of order) {
          const columnDef = formulaColumns.find((c) => c.id === columnId);
          if (columnDef?.formula) {
            try {
              const result = this.formulaEngine.evaluateFormula(
                columnDef.formula,
                context,
              );
              enriched.values[columnId] = result;
              context[columnId] = result;
            } catch (error: any) {
              enriched.values[columnId] = null;
            }
          }
        }
      } catch (error) {
      }
    }

    return enriched;
  }
}
