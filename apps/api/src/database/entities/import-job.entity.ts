import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Module } from './module.entity';
import { User } from './user.entity';

export enum ImportJobStatus {
  PENDING = 'PENDING',
  MAPPING = 'MAPPING',
  VALIDATING = 'VALIDATING',
  IMPORTING = 'IMPORTING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK',
}

@Entity('import_jobs')
@Index(['moduleId', 'createdAt'])
@Index(['status', 'createdAt'])
export class ImportJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  moduleId: string;

  @Column('uuid')
  createdById: string;

  @Column({ type: 'varchar', enum: ImportJobStatus, default: ImportJobStatus.PENDING })
  status: ImportJobStatus;

  @Column({ nullable: true })
  originalFileName: string;

  @Column()
  totalRows: number;

  @Column({ default: 0 })
  processedRows: number;

  @Column({ default: 0 })
  importedRows: number;

  @Column({ default: 0 })
  failedRows: number;

  @Column('jsonb', { default: [] })
  columnMapping: Array<{
    csvColumnIndex: number;
    csvColumnName: string;
    moduleColumnId?: string;
    moduleColumnName?: string;
    type?: string;
  }>;

  @Column({ type: 'varchar', nullable: true })
  duplicateHandling: 'IGNORE' | 'SKIP' | 'UPDATE' | 'ERROR';

  @Column('jsonb', { nullable: true })
  deduplicationColumns: string[];

  @Column('jsonb', { nullable: true })
  typeInference?: Record<string, unknown>;

  @Column('text', { nullable: true })
  csvData?: string;

  @Column('jsonb', { default: [] })
  errors: Array<{
    rowIndex: number;
    columnName: string;
    error: string;
  }>;

  @Column({ nullable: true })
  errorSummary?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Module, { onDelete: 'CASCADE' })
  module: Module;

  @ManyToOne(() => User)
  createdBy: User;
}
