import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Column, ColumnType } from '../database/entities/column.entity';
import { Module } from '../database/entities/module.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { FormulaEngine } from '../formula/formula.engine';

@Injectable()
export class ColumnsService {
  constructor(
    @InjectRepository(Column)
    private columnRepository: Repository<Column>,
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private formulaEngine: FormulaEngine,
  ) {}

  async create(
    moduleId: string,
    departmentId: string,
    createColumnDto: CreateColumnDto,
    userId: string,
  ): Promise<Column> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId, departmentId },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    if (createColumnDto.type === ColumnType.FORMULA && !createColumnDto.formula) {
      throw new BadRequestException('Formula column requires a formula');
    }

    if (createColumnDto.formula) {
      this.formulaEngine.validateFormula(createColumnDto.formula);
    }

    const column = this.columnRepository.create({
      ...createColumnDto,
      moduleId,
      version: 1,
    });

    const savedColumn = await this.columnRepository.save(column);

    await this.auditLogRepository.save({
      entityType: 'Column',
      entityId: savedColumn.id,
      action: 'CREATE',
      userId,
      departmentId,
      changes: {
        created: true,
        name: savedColumn.name,
        type: savedColumn.type,
      },
    });

    return savedColumn;
  }

  async findOne(
    id: string,
    moduleId: string,
    departmentId: string,
  ): Promise<Column> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId, departmentId },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    const column = await this.columnRepository.findOne({
      where: { id, moduleId },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    return column;
  }

  async findAll(moduleId: string, departmentId: string): Promise<Column[]> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId, departmentId },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    return this.columnRepository.find({
      where: { moduleId },
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    moduleId: string,
    departmentId: string,
    updateColumnDto: UpdateColumnDto,
    userId: string,
  ): Promise<Column> {
    const column = await this.findOne(id, moduleId, departmentId);

    if (updateColumnDto.version !== column.version) {
      throw new ConflictException('Version mismatch - data has been modified');
    }

    const oldValues = { ...column };

    if (updateColumnDto.type === ColumnType.FORMULA && !updateColumnDto.formula && !column.formula) {
      throw new BadRequestException('Formula column requires a formula');
    }

    if (updateColumnDto.formula) {
      this.formulaEngine.validateFormula(updateColumnDto.formula);
    }

    if (updateColumnDto.name !== undefined) {
      column.name = updateColumnDto.name;
    }
    if (updateColumnDto.description !== undefined) {
      column.description = updateColumnDto.description;
    }
    if (updateColumnDto.type !== undefined) {
      column.type = updateColumnDto.type;
    }
    if (updateColumnDto.order !== undefined) {
      column.order = updateColumnDto.order;
    }
    if (updateColumnDto.validationRules !== undefined) {
      column.validationRules = updateColumnDto.validationRules;
    }
    if (updateColumnDto.options !== undefined) {
      column.options = updateColumnDto.options;
    }
    if (updateColumnDto.formula !== undefined) {
      column.formula = updateColumnDto.formula;
    }
    if (updateColumnDto.isRequired !== undefined) {
      column.isRequired = updateColumnDto.isRequired;
    }
    if (updateColumnDto.isVisible !== undefined) {
      column.isVisible = updateColumnDto.isVisible;
    }

    column.version += 1;

    const updatedColumn = await this.columnRepository.save(column);

    const changes: Record<string, unknown> = {};
    Object.keys(updateColumnDto).forEach((key) => {
      if (key !== 'version' && oldValues[key as keyof Column] !== (updateColumnDto as any)[key]) {
        changes[key] = {
          old: oldValues[key as keyof Column],
          new: (updateColumnDto as any)[key],
        };
      }
    });

    if (Object.keys(changes).length > 0) {
      await this.auditLogRepository.save({
        entityType: 'Column',
        entityId: id,
        action: 'UPDATE',
        userId,
        departmentId,
        changes,
      });
    }

    return updatedColumn;
  }

  async delete(
    id: string,
    moduleId: string,
    departmentId: string,
    userId: string,
  ): Promise<void> {
    const column = await this.findOne(id, moduleId, departmentId);

    await this.auditLogRepository.save({
      entityType: 'Column',
      entityId: id,
      action: 'DELETE',
      userId,
      departmentId,
      changes: { deleted: true, name: column.name, type: column.type },
    });

    await this.columnRepository.remove(column);
  }

  async reorderColumns(
    moduleId: string,
    departmentId: string,
    columnIds: string[],
    userId: string,
  ): Promise<Column[]> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId, departmentId },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    const columns = await this.columnRepository.find({
      where: { moduleId },
    });

    const columnMap = new Map(columns.map((c) => [c.id, c]));
    const updates: Column[] = [];

    columnIds.forEach((columnId, index) => {
      const column = columnMap.get(columnId);
      if (!column) {
        throw new NotFoundException(`Column ${columnId} not found`);
      }
      column.order = index;
      updates.push(column);
    });

    await this.columnRepository.save(updates);

    await this.auditLogRepository.save({
      entityType: 'Module',
      entityId: moduleId,
      action: 'UPDATE',
      userId,
      departmentId,
      changes: { columnOrder: { new: columnIds } },
    });

    return updates;
  }
}
