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

@Entity('rows')
@Index(['moduleId', 'createdAt'])
@Index(['moduleId', 'updatedAt'])
export class Row {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  moduleId: string;

  @Column('uuid')
  createdById: string;

  @Column('uuid', { nullable: true })
  updatedById?: string;

  @Column('jsonb', { default: {} })
  values: Record<string, unknown>;

  @Column({ default: 1 })
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Module, { onDelete: 'CASCADE' })
  module: Module;

  @ManyToOne(() => User)
  createdBy: User;

  @ManyToOne(() => User, { nullable: true })
  updatedBy?: User;
}
