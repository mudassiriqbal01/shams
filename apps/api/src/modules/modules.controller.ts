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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentRlsGuard } from '../auth/guards/department-rls.guard';
import { ModuleDto, JwtPayload } from '@shams-vision/shared';

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
}
