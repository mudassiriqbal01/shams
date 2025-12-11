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

export enum MetricType {
  SUM = 'SUM',
  AVG = 'AVG',
  COUNT = 'COUNT',
  CUSTOM = 'CUSTOM',
}

@Entity('metric_definitions')
@Index(['moduleId', 'name'], { unique: true })
export class MetricDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  moduleId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'varchar', enum: MetricType })
  type: MetricType;

  @Column({ nullable: true })
  columnId?: string;

  @Column({ type: 'integer', nullable: true, name: 'metric_order' })
  order?: number;

  @Column('jsonb', { nullable: true })
  aggregationExpression?: Record<string, unknown>;

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
