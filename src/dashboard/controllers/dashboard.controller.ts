import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { CreateDashboardDto } from '../dto/create-dashboard.dto';
import { UpdateDashboardDto } from '../dto/update-dashboard.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

@Controller('dashboards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Post()
  create(@Body() createDashboardDto: CreateDashboardDto, @Request() req) {
    return this.dashboardService.create(createDashboardDto, req.user.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.dashboardService.findAll(req.user.id, req.user.roles || []);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.dashboardService.findOne(id, req.user.id, req.user.roles || []);
  }

  @Get(':id/metrics')
  getMetrics(
    @Param('id') id: string,
    @Query('filters') filters: string,
    @Request() req,
  ) {
    const parsedFilters = filters ? JSON.parse(filters) : {};
    return this.dashboardService.getMetrics(
      id,
      req.user.id,
      req.user.roles || [],
      parsedFilters,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDashboardDto: UpdateDashboardDto,
    @Request() req,
  ) {
    return this.dashboardService.update(
      id,
      updateDashboardDto,
      req.user.id,
      req.user.roles || [],
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.dashboardService.remove(id, req.user.id, req.user.roles || []);
  }
}
