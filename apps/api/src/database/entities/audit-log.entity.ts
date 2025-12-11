import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Department } from './department.entity';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entityType: string;

  @Column('uuid')
  entityId: string;

  @Column()
  action: AuditAction;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  departmentId: string;

  @Column('jsonb', { default: {} })
  changes: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.auditLogs)
  user: User;

  @ManyToOne(() => Department, (dept) => dept.auditLogs)
  department: Department;
}
