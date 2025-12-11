import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentRlsGuard } from '../auth/guards/department-rls.guard';
import { RoleDto, JwtPayload } from '@shams-vision/shared';

@Controller('roles')
@UseGuards(JwtAuthGuard, DepartmentRlsGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  async getRoles(@Request() req: { user: JwtPayload }): Promise<RoleDto[]> {
    const roles = await this.rolesService.findByDepartment(req.user.activeDepartmentId);
    return Promise.all(roles.map((r) => this.rolesService.toDto(r)));
  }

  @Get(':id')
  async getRole(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<RoleDto> {
    const role = await this.rolesService.findOne(id, req.user.activeDepartmentId);
    return this.rolesService.toDto(role);
  }
}
