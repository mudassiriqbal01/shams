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
import { UserDepartmentMembership } from './user-department-membership.entity';
import { ModulePermission } from './module-permission.entity';
import { PermissionType } from '@shams-vision/shared';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('uuid')
  departmentId: string;

  @Column('text', { array: true })
  permissions: PermissionType[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Department, (dept) => dept.roles, { onDelete: 'CASCADE' })
  department: Department;

  @ManyToOne(() => UserDepartmentMembership, (m) => m.roles, {
    onDelete: 'CASCADE',
  })
  membership: UserDepartmentMembership;

  @OneToMany(() => ModulePermission, (mp) => mp.role)
  modulePermissions: ModulePermission[];
}
