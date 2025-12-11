import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Module } from '../database/entities/module.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ModuleDto, ColumnDefinition, ConflictError, GridColumnConfig } from '@shams-vision/shared';

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

  // Column management methods
  async addColumn(
    moduleId: string,
    departmentId: string,
    createColumnDto: CreateColumnDto,
    userId: string,
  ): Promise<Module> {
    const module = await this.findOne(moduleId, departmentId);

    // Initialize grid config if not exists
    const currentConfig = module.metadata.gridConfig as GridColumnConfig || {
      columns: [],
      version: 1,
      lastModified: new Date(),
    };

    // Check for duplicate field names
    if (currentConfig.columns.some(col => col.field === createColumnDto.field)) {
      throw new BadRequestException(`Field name "${createColumnDto.field}" already exists`);
    }

    // Create column definition
    const columnDefinition: ColumnDefinition = {
      id: this.generateColumnId(),
      name: createColumnDto.name,
      field: createColumnDto.field,
      type: createColumnDto.type,
      width: createColumnDto.width,
      minWidth: createColumnDto.minWidth,
      maxWidth: createColumnDto.maxWidth,
      resizable: createColumnDto.resizable ?? true,
      sortable: createColumnDto.sortable ?? true,
      filterable: createColumnDto.filterable ?? true,
      pinned: createColumnDto.pinned,
      editable: createColumnDto.editable ?? true,
      required: createColumnDto.required ?? false,
      unique: createColumnDto.unique ?? false,
      defaultValue: createColumnDto.defaultValue,
      validation: createColumnDto.validation,
      options: createColumnDto.options,
      permissions: createColumnDto.permissions,
      order: createColumnDto.order,
      hidden: createColumnDto.hidden ?? false,
      headerName: createColumnDto.headerName,
      description: createColumnDto.description,
    };

    // Add column to config
    currentConfig.columns.push(columnDefinition);
    currentConfig.columns.sort((a, b) => a.order - b.order);
    currentConfig.version += 1;
    currentConfig.lastModified = new Date();

    // Update module metadata
    module.metadata = {
      ...module.metadata,
      gridConfig: currentConfig,
    };
    module.version += 1;

    const updatedModule = await this.moduleRepository.save(module);

    // Log column creation
    await this.auditLogRepository.save({
      entityType: 'Module',
      entityId: moduleId,
      action: 'UPDATE',
      userId,
      departmentId,
      changes: {
        columnAdded: true,
        columnName: createColumnDto.name,
        columnField: createColumnDto.field,
        columnType: createColumnDto.type,
        gridConfig: currentConfig,
      },
    });

    return updatedModule;
  }

  async updateColumn(
    moduleId: string,
    departmentId: string,
    columnId: string,
    updateColumnDto: UpdateColumnDto,
    userId: string,
  ): Promise<Module> {
    const module = await this.findOne(moduleId, departmentId);

    const currentConfig = module.metadata.gridConfig as GridColumnConfig;
    if (!currentConfig || !currentConfig.columns) {
      throw new NotFoundException('No column configuration found for this module');
    }

    // Find column index
    const columnIndex = currentConfig.columns.findIndex(col => col.id === columnId);
    if (columnIndex === -1) {
      throw new NotFoundException(`Column with id "${columnId}" not found`);
    }

    // Check version for optimistic locking
    if (updateColumnDto.version !== currentConfig.version) {
      throw new ConflictException(
        new ConflictError('GridConfig', currentConfig.version).message,
      );
    }

    const oldColumn = { ...currentConfig.columns[columnIndex] };

    // Update column properties
    const updatedColumn = { ...currentConfig.columns[columnIndex] };
    
    if (updateColumnDto.name !== undefined) updatedColumn.name = updateColumnDto.name;
    if (updateColumnDto.field !== undefined) updatedColumn.field = updateColumnDto.field;
    if (updateColumnDto.type !== undefined) updatedColumn.type = updateColumnDto.type;
    if (updateColumnDto.width !== undefined) updatedColumn.width = updateColumnDto.width;
    if (updateColumnDto.minWidth !== undefined) updatedColumn.minWidth = updateColumnDto.minWidth;
    if (updateColumnDto.maxWidth !== undefined) updatedColumn.maxWidth = updateColumnDto.maxWidth;
    if (updateColumnDto.resizable !== undefined) updatedColumn.resizable = updateColumnDto.resizable;
    if (updateColumnDto.sortable !== undefined) updatedColumn.sortable = updateColumnDto.sortable;
    if (updateColumnDto.filterable !== undefined) updatedColumn.filterable = updateColumnDto.filterable;
    if (updateColumnDto.pinned !== undefined) updatedColumn.pinned = updateColumnDto.pinned;
    if (updateColumnDto.editable !== undefined) updatedColumn.editable = updateColumnDto.editable;
    if (updateColumnDto.required !== undefined) updatedColumn.required = updateColumnDto.required;
    if (updateColumnDto.unique !== undefined) updatedColumn.unique = updateColumnDto.unique;
    if (updateColumnDto.defaultValue !== undefined) updatedColumn.defaultValue = updateColumnDto.defaultValue;
    if (updateColumnDto.validation !== undefined) updatedColumn.validation = updateColumnDto.validation;
    if (updateColumnDto.options !== undefined) updatedColumn.options = updateColumnDto.options;
    if (updateColumnDto.permissions !== undefined) updatedColumn.permissions = updateColumnDto.permissions;
    if (updateColumnDto.order !== undefined) updatedColumn.order = updateColumnDto.order;
    if (updateColumnDto.hidden !== undefined) updatedColumn.hidden = updateColumnDto.hidden;
    if (updateColumnDto.headerName !== undefined) updatedColumn.headerName = updateColumnDto.headerName;
    if (updateColumnDto.description !== undefined) updatedColumn.description = updateColumnDto.description;

    currentConfig.columns[columnIndex] = updatedColumn;
    currentConfig.version += 1;
    currentConfig.lastModified = new Date();

    // Sort columns by order
    currentConfig.columns.sort((a, b) => a.order - b.order);

    // Update module metadata
    module.metadata = {
      ...module.metadata,
      gridConfig: currentConfig,
    };
    module.version += 1;

    const updatedModule = await this.moduleRepository.save(module);

    // Log column update
    const changes: Record<string, unknown> = {
      columnUpdated: true,
      columnId,
    };

    Object.keys(updateColumnDto).forEach(key => {
      if (key !== 'version' && updateColumnDto[key as keyof UpdateColumnDto] !== undefined) {
        changes[`column.${key}`] = {
          old: oldColumn[key as keyof ColumnDefinition],
          new: updatedColumn[key as keyof ColumnDefinition],
        };
      }
    });

    await this.auditLogRepository.save({
      entityType: 'Module',
      entityId: moduleId,
      action: 'UPDATE',
      userId,
      departmentId,
      changes,
    });

    return updatedModule;
  }

  async removeColumn(
    moduleId: string,
    departmentId: string,
    columnId: string,
    userId: string,
  ): Promise<Module> {
    const module = await this.findOne(moduleId, departmentId);

    const currentConfig = module.metadata.gridConfig as GridColumnConfig;
    if (!currentConfig || !currentConfig.columns) {
      throw new NotFoundException('No column configuration found for this module');
    }

    const columnIndex = currentConfig.columns.findIndex(col => col.id === columnId);
    if (columnIndex === -1) {
      throw new NotFoundException(`Column with id "${columnId}" not found`);
    }

    const removedColumn = currentConfig.columns[columnIndex];
    currentConfig.columns.splice(columnIndex, 1);
    currentConfig.version += 1;
    currentConfig.lastModified = new Date();

    // Update module metadata
    module.metadata = {
      ...module.metadata,
      gridConfig: currentConfig,
    };
    module.version += 1;

    const updatedModule = await this.moduleRepository.save(module);

    // Log column removal
    await this.auditLogRepository.save({
      entityType: 'Module',
      entityId: moduleId,
      action: 'UPDATE',
      userId,
      departmentId,
      changes: {
        columnRemoved: true,
        columnName: removedColumn.name,
        columnField: removedColumn.field,
        columnType: removedColumn.type,
        gridConfig: currentConfig,
      },
    });

    return updatedModule;
  }

  async getColumnConfig(
    moduleId: string,
    departmentId: string,
  ): Promise<GridColumnConfig | null> {
    const module = await this.findOne(moduleId, departmentId);
    return module.metadata.gridConfig as GridColumnConfig || null;
  }

  private generateColumnId(): string {
    return `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
