import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Department } from './department.entity';
import { ModulePermission } from './module-permission.entity';

@Entity('modules')
export class Module {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('uuid')
  departmentId: string;

  @Column('jsonb', { default: {} })
  metadata: Record<string, unknown>;

  @Column({ default: 1 })
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Department, (dept) => dept.modules, { onDelete: 'CASCADE' })
  department: Department;

  @OneToMany(() => ModulePermission, (mp) => mp.module)
  permissions: ModulePermission[];
}
