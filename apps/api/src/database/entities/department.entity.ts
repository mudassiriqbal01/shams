import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserDepartmentMembership } from './user-department-membership.entity';
import { Module } from './module.entity';
import { Role } from './role.entity';
import { AuditLog } from './audit-log.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UserDepartmentMembership, (membership) => membership.department)
  memberships: UserDepartmentMembership[];

  @OneToMany(() => Module, (module) => module.department)
  modules: Module[];

  @OneToMany(() => Role, (role) => role.department)
  roles: Role[];

  @OneToMany(() => AuditLog, (log) => log.department)
  auditLogs: AuditLog[];
}
