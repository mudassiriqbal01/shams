import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentRlsGuard } from '../auth/guards/department-rls.guard';
import { JwtPayload, DepartmentDto } from '@shams-vision/shared';

@Controller('departments')
@UseGuards(JwtAuthGuard, DepartmentRlsGuard)
export class DepartmentsController {
  constructor(private departmentsService: DepartmentsService) {}

  @Get(':id')
  async getDepartment(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<DepartmentDto> {
    const department = await this.departmentsService.findOne(
      id,
      req.user.activeDepartmentId,
    );
    return this.departmentsService.toDto(department);
  }

  @Get()
  async getCurrentDepartment(
    @Request() req: { user: JwtPayload },
  ): Promise<DepartmentDto> {
    const department = await this.departmentsService.findOne(
      req.user.activeDepartmentId,
      req.user.activeDepartmentId,
    );
    return this.departmentsService.toDto(department);
  }
}
