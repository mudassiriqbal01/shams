import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentRlsGuard } from '../auth/guards/department-rls.guard';
import { ModuleDto, JwtPayload, GridColumnConfig } from '@shams-vision/shared';

@Controller('modules')
@UseGuards(JwtAuthGuard, DepartmentRlsGuard)
export class ModulesController {
  constructor(private modulesService: ModulesService) {}

  @Post()
  async create(
    @Body() createModuleDto: CreateModuleDto,
    @Request() req: { user: JwtPayload },
  ): Promise<ModuleDto> {
    const module = await this.modulesService.create(
      createModuleDto,
      req.user.activeDepartmentId,
      req.user.userId,
    );
    return this.modulesService.toDto(module);
  }

  @Get()
  async findAll(@Request() req: { user: JwtPayload }): Promise<ModuleDto[]> {
    const modules = await this.modulesService.findAll(req.user.activeDepartmentId);
    return modules.map((m) => this.modulesService.toDto(m));
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<ModuleDto> {
    const module = await this.modulesService.findOne(id, req.user.activeDepartmentId);
    return this.modulesService.toDto(module);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateModuleDto: UpdateModuleDto,
    @Request() req: { user: JwtPayload },
  ): Promise<ModuleDto> {
    const module = await this.modulesService.update(
      id,
      req.user.activeDepartmentId,
      updateModuleDto,
      req.user.userId,
    );
    return this.modulesService.toDto(module);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<void> {
    return this.modulesService.delete(id, req.user.activeDepartmentId, req.user.userId);
  }

  // Column management endpoints
  @Post(':id/columns')
  async addColumn(
    @Param('id') moduleId: string,
    @Body() createColumnDto: CreateColumnDto,
    @Request() req: { user: JwtPayload },
  ): Promise<ModuleDto> {
    const module = await this.modulesService.addColumn(
      moduleId,
      req.user.activeDepartmentId,
      createColumnDto,
      req.user.userId,
    );
    return this.modulesService.toDto(module);
  }

  @Put(':id/columns/:columnId')
  async updateColumn(
    @Param('id') moduleId: string,
    @Param('columnId') columnId: string,
    @Body() updateColumnDto: UpdateColumnDto,
    @Request() req: { user: JwtPayload },
  ): Promise<ModuleDto> {
    const module = await this.modulesService.updateColumn(
      moduleId,
      req.user.activeDepartmentId,
      columnId,
      updateColumnDto,
      req.user.userId,
    );
    return this.modulesService.toDto(module);
  }

  @Delete(':id/columns/:columnId')
  async removeColumn(
    @Param('id') moduleId: string,
    @Param('columnId') columnId: string,
    @Request() req: { user: JwtPayload },
  ): Promise<ModuleDto> {
    const module = await this.modulesService.removeColumn(
      moduleId,
      req.user.activeDepartmentId,
      columnId,
      req.user.userId,
    );
    return this.modulesService.toDto(module);
  }

  @Get(':id/columns')
  async getColumnConfig(
    @Param('id') moduleId: string,
    @Request() req: { user: JwtPayload },
  ): Promise<GridColumnConfig | null> {
    return this.modulesService.getColumnConfig(moduleId, req.user.activeDepartmentId);
  }
}
