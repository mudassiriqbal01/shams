import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ImportJob, ImportJobStatus } from '../database/entities/import-job.entity';
import { Module } from '../database/entities/module.entity';
import { Column, ColumnType } from '../database/entities/column.entity';
import { Row } from '../database/entities/row.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { CreateImportJobDto } from './dto/create-import-job.dto';
import { ConfirmImportDto, ColumnMappingDto } from './dto/confirm-import.dto';
import { RowsService } from './rows.service';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(ImportJob)
    private importJobRepository: Repository<ImportJob>,
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
    @InjectRepository(Column)
    private columnRepository: Repository<Column>,
    @InjectRepository(Row)
    private rowRepository: Repository<Row>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private rowsService: RowsService,
    private dataSource: DataSource,
  ) {}

  async createImportJob(
    moduleId: string,
    departmentId: string,
    createImportJobDto: CreateImportJobDto,
    userId: string,
  ): Promise<ImportJob> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId, departmentId },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    const csvRows = this.parseCSV(createImportJobDto.csvData || '');

    if (csvRows.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    const job = this.importJobRepository.create({
      moduleId,
      createdById: userId,
      originalFileName: createImportJobDto.originalFileName,
      totalRows: csvRows.length - 1,
      status: ImportJobStatus.MAPPING,
      csvData: createImportJobDto.csvData,
      columnMapping: this.inferColumnMapping(csvRows[0] || [], moduleId),
    });

    const savedJob = await this.importJobRepository.save(job);

    await this.auditLogRepository.save({
      entityType: 'ImportJob',
      entityId: savedJob.id,
      action: 'CREATE',
      userId,
      departmentId,
      changes: {
        created: true,
        fileName: savedJob.originalFileName,
        totalRows: savedJob.totalRows,
      },
    });

    return savedJob;
  }

  async getImportJob(
    id: string,
    moduleId: string,
    departmentId: string,
  ): Promise<ImportJob> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId, departmentId },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    const job = await this.importJobRepository.findOne({
      where: { id, moduleId },
    });

    if (!job) {
      throw new NotFoundException('Import job not found');
    }

    return job;
  }

  async confirmImport(
    id: string,
    moduleId: string,
    departmentId: string,
    confirmImportDto: ConfirmImportDto,
    userId: string,
  ): Promise<ImportJob> {
    const job = await this.getImportJob(id, moduleId, departmentId);

    if (job.status !== ImportJobStatus.MAPPING) {
      throw new BadRequestException(
        `Cannot confirm import with status: ${job.status}`,
      );
    }

    job.columnMapping = confirmImportDto.columnMapping;
    job.status = ImportJobStatus.VALIDATING;

    return this.importJobRepository.save(job);
  }

  async executeImport(
    id: string,
    moduleId: string,
    departmentId: string,
    userId: string,
  ): Promise<ImportJob> {
    const job = await this.getImportJob(id, moduleId, departmentId);

    if (job.status !== ImportJobStatus.VALIDATING) {
      throw new BadRequestException(
        `Cannot execute import with status: ${job.status}`,
      );
    }

    job.status = ImportJobStatus.IMPORTING;
    await this.importJobRepository.save(job);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const csvRows = this.parseCSV(job.csvData || '');
      const headers = csvRows[0] || [];
      const columns = await this.columnRepository.find({
        where: { moduleId },
      });

      const errors: Array<{ rowIndex: number; columnName: string; error: string }> = [];
      let importedRows = 0;

      for (let i = 1; i < csvRows.length; i++) {
        const csvRow = csvRows[i];
        const values: Record<string, unknown> = {};

        try {
          for (const mapping of job.columnMapping) {
            if (
              mapping.moduleColumnId &&
              mapping.csvColumnIndex < csvRow.length
            ) {
              values[mapping.moduleColumnId] = csvRow[mapping.csvColumnIndex];
            }
          }

          const row = this.rowRepository.create({
            moduleId,
            createdById: userId,
            values,
            version: 1,
          });

          await queryRunner.manager.save(row);
          importedRows++;
          job.importedRows = importedRows;
          job.processedRows = i;
        } catch (error: any) {
          errors.push({
            rowIndex: i,
            columnName: 'row',
            error: error.message,
          });
          job.failedRows += 1;
          job.processedRows = i;
        }
      }

      if (errors.length === 0) {
        await queryRunner.commitTransaction();
        job.status = ImportJobStatus.COMPLETED;
        job.errors = [];
      } else if (errors.length < csvRows.length - 1) {
        await queryRunner.commitTransaction();
        job.status = ImportJobStatus.COMPLETED;
        job.errors = errors;
        job.errorSummary = `${errors.length} of ${csvRows.length - 1} rows failed`;
      } else {
        await queryRunner.rollbackTransaction();
        job.status = ImportJobStatus.ROLLED_BACK;
        job.errors = errors;
        job.errorSummary = 'All rows failed validation, import rolled back';
      }
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      job.status = ImportJobStatus.FAILED;
      job.errorSummary = error.message;
    } finally {
      await queryRunner.release();
    }

    const savedJob = await this.importJobRepository.save(job);

    await this.auditLogRepository.save({
      entityType: 'ImportJob',
      entityId: id,
      action: 'UPDATE',
      userId,
      departmentId,
      changes: {
        status: { old: ImportJobStatus.IMPORTING, new: job.status },
        importedRows: { new: job.importedRows },
        failedRows: { new: job.failedRows },
      },
    });

    return savedJob;
  }

  private parseCSV(data: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      const nextChar = data[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (currentField || currentRow.length > 0) {
          currentRow.push(currentField.trim());
          if (currentRow.some((f) => f.length > 0)) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentField = '';
        }
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentField += char;
      }
    }

    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  }

  private inferColumnMapping(
    headers: string[],
    moduleId: string,
  ): Array<ColumnMappingDto> {
    return headers.map((header, index) => ({
      csvColumnIndex: index,
      csvColumnName: header,
    }));
  }
}
