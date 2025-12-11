import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Module } from '../database/entities/module.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ModuleDto, ConflictError } from '@shams-vision/shared';

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(
    createModuleDto: CreateModuleDto,
    departmentId: string,
    userId: string,
  ): Promise<Module> {
    const module = this.moduleRepository.create({
      ...createModuleDto,
      departmentId,
      metadata: createModuleDto.metadata || {},
      version: 1,
    });

    const savedModule = await this.moduleRepository.save(module);

    // Log creation
    await this.auditLogRepository.save({
      entityType: 'Module',
      entityId: savedModule.id,
      action: 'CREATE',
      userId,
      departmentId,
      changes: { created: true, name: savedModule.name },
    });

    return savedModule;
  }

  async findOne(id: string, departmentId: string): Promise<Module> {
    const module = await this.moduleRepository.findOne({
      where: { id, departmentId },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    return module;
  }

  async findAll(departmentId: string): Promise<Module[]> {
    return this.moduleRepository.find({
      where: { departmentId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    departmentId: string,
    updateModuleDto: UpdateModuleDto,
    userId: string,
  ): Promise<Module> {
    const module = await this.findOne(id, departmentId);

    // Last-Write-Wins optimistic concurrency check
    if (updateModuleDto.version !== module.version) {
      throw new ConflictException(
        new ConflictError('Module', module.version).message,
      );
    }

    const oldValues = { ...module };

    // Update only provided fields
    if (updateModuleDto.name !== undefined) {
      module.name = updateModuleDto.name;
    }
    if (updateModuleDto.description !== undefined) {
      module.description = updateModuleDto.description;
    }
    if (updateModuleDto.metadata !== undefined) {
      module.metadata = updateModuleDto.metadata;
    }

    module.version += 1;

    const updatedModule = await this.moduleRepository.save(module);

    // Log update
    const changes: Record<string, unknown> = {};
    if (updateModuleDto.name !== undefined && oldValues.name !== updateModuleDto.name) {
      changes.name = { old: oldValues.name, new: updateModuleDto.name };
    }
    if (
      updateModuleDto.description !== undefined &&
      oldValues.description !== updateModuleDto.description
    ) {
      changes.description = { old: oldValues.description, new: updateModuleDto.description };
    }
    if (
      updateModuleDto.metadata !== undefined &&
      JSON.stringify(oldValues.metadata) !== JSON.stringify(updateModuleDto.metadata)
    ) {
      changes.metadata = { old: oldValues.metadata, new: updateModuleDto.metadata };
    }

    if (Object.keys(changes).length > 0) {
      await this.auditLogRepository.save({
        entityType: 'Module',
        entityId: id,
        action: 'UPDATE',
        userId,
        departmentId,
        changes,
      });
    }

    return updatedModule;
  }

  async delete(id: string, departmentId: string, userId: string): Promise<void> {
    const module = await this.findOne(id, departmentId);

    await this.auditLogRepository.save({
      entityType: 'Module',
      entityId: id,
      action: 'DELETE',
      userId,
      departmentId,
      changes: { deleted: true, name: module.name },
    });

    await this.moduleRepository.remove(module);
  }

  toDto(module: Module): ModuleDto {
    return {
      id: module.id,
      name: module.name,
      description: module.description,
      departmentId: module.departmentId,
      metadata: module.metadata,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt,
      version: module.version,
    };
  }
}
