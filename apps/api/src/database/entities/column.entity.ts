import {
  Entity,
  PrimaryGeneratedColumn,
  Column as ORMColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Module } from './module.entity';

export enum ColumnType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  SINGLE_SELECT = 'SINGLE_SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  FORMULA = 'FORMULA',
}

@Entity('columns')
@Index(['moduleId', 'name'], { unique: true })
export class Column {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ORMColumn('uuid')
  moduleId: string;

  @ORMColumn()
  name: string;

  @ORMColumn({ nullable: true })
  description: string;

  @ORMColumn({ type: 'varchar', enum: ColumnType })
  type: ColumnType;

  @ORMColumn({ type: 'integer', default: 0, name: 'column_order' })
  order: number;

  @ORMColumn('jsonb', { default: {} })
  validationRules: Record<string, unknown>;

  @ORMColumn('jsonb', { nullable: true })
  options?: Record<string, unknown>;

  @ORMColumn({ nullable: true })
  formula?: string;

  @ORMColumn({ default: false })
  isRequired: boolean;

  @ORMColumn({ default: true })
  isVisible: boolean;

  @ORMColumn({ default: 1 })
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Module, { onDelete: 'CASCADE' })
  module: Module;
}
