import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Module } from './module.entity';
import { Role } from './role.entity';
import { PermissionType } from '@shams-vision/shared';

@Entity('module_permissions')
export class ModulePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  moduleId: string;

  @Column('uuid')
  roleId: string;

  @Column('text', { array: true })
  permissions: PermissionType[];

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Module, (module) => module.permissions, {
    onDelete: 'CASCADE',
  })
  module: Module;

  @ManyToOne(() => Role, (role) => role.modulePermissions, {
    onDelete: 'CASCADE',
  })
  role: Role;
}
