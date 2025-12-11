import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../database/entities/role.entity';
import { RoleDto, PermissionType } from '@shams-vision/shared';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async findByDepartment(departmentId: string): Promise<Role[]> {
    return this.roleRepository.find({
      where: { departmentId },
      relations: ['modulePermissions'],
    });
  }

  async findOne(id: string, departmentId: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id, departmentId },
      relations: ['modulePermissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async create(
    name: string,
    departmentId: string,
    permissions: PermissionType[],
  ): Promise<Role> {
    const role = this.roleRepository.create({
      name,
      departmentId,
      permissions,
    });

    return this.roleRepository.save(role);
  }

  async update(
    id: string,
    departmentId: string,
    name?: string,
    permissions?: PermissionType[],
  ): Promise<Role> {
    const role = await this.findOne(id, departmentId);

    if (name !== undefined) {
      role.name = name;
    }

    if (permissions !== undefined) {
      role.permissions = permissions;
    }

    return this.roleRepository.save(role);
  }

  async toDto(role: Role): Promise<RoleDto> {
    return {
      id: role.id,
      name: role.name,
      departmentId: role.departmentId,
      permissions: role.permissions,
    };
  }
}
