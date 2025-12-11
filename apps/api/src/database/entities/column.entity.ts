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

  @Column('uuid')
  moduleId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'varchar', enum: ColumnType })
  type: ColumnType;

  @Column({ type: 'integer', default: 0, name: 'column_order' })
  order: number;

  @Column('jsonb', { default: {} })
  validationRules: Record<string, unknown>;

  @Column('jsonb', { nullable: true })
  options?: Record<string, unknown>;

  @Column({ nullable: true })
  formula?: string;

  @Column({ default: false })
  isRequired: boolean;

  @Column({ default: true })
  isVisible: boolean;

  @Column({ default: 1 })
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Module, { onDelete: 'CASCADE' })
  module: Module;
}
