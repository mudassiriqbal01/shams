import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Department } from './department.entity';
import { Role } from './role.entity';

@Entity('user_department_memberships')
export class UserDepartmentMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  departmentId: string;

  @CreateDateColumn()
  joinedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.memberships, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Department, (dept) => dept.memberships, {
    onDelete: 'CASCADE',
  })
  department: Department;

  @OneToMany(() => Role, (role) => role.membership, { eager: true })
  roles: Role[];
}
