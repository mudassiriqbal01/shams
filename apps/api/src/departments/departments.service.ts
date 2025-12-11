import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../database/entities/department.entity';
import { DepartmentDto } from '@shams-vision/shared';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
  ) {}

  async create(name: string, description?: string): Promise<Department> {
    const department = this.departmentRepository.create({
      name,
      description,
    });
    return this.departmentRepository.save(department);
  }

  async findOne(id: string, departmentId: string): Promise<Department> {
    // Verify user has access to this department
    if (id !== departmentId) {
      throw new ForbiddenException('Access denied to this department');
    }

    const department = await this.departmentRepository.findOne({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  async findAll(departmentId: string): Promise<Department[]> {
    return this.departmentRepository.find({
      where: { id: departmentId },
    });
  }

  async toDto(department: Department): Promise<DepartmentDto> {
    return {
      id: department.id,
      name: department.name,
      description: department.description,
    };
  }
}
