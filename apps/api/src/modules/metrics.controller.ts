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
  Query,
} from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { CreateMetricDto } from './dto/create-metric.dto';
import { UpdateMetricDto } from './dto/update-metric.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentRlsGuard } from '../auth/guards/department-rls.guard';
import { JwtPayload } from '@shams-vision/shared';
import { MetricDefinition } from '../database/entities/metric-definition.entity';

@Controller('modules/:moduleId/metrics')
@UseGuards(JwtAuthGuard, DepartmentRlsGuard)
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Post()
  async create(
    @Param('moduleId') moduleId: string,
    @Body() createMetricDto: CreateMetricDto,
    @Request() req: { user: JwtPayload },
  ): Promise<MetricDefinition> {
    return this.metricsService.create(
      moduleId,
      req.user.activeDepartmentId,
      createMetricDto,
      req.user.userId,
    );
  }

  @Get()
  async findAll(
    @Param('moduleId') moduleId: string,
    @Request() req: { user: JwtPayload },
  ): Promise<MetricDefinition[]> {
    return this.metricsService.findAll(
      moduleId,
      req.user.activeDepartmentId,
    );
  }

  @Get(':id')
  async findOne(
    @Param('moduleId') moduleId: string,
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<MetricDefinition> {
    return this.metricsService.findOne(
      id,
      moduleId,
      req.user.activeDepartmentId,
    );
  }

  @Put(':id')
  async update(
    @Param('moduleId') moduleId: string,
    @Param('id') id: string,
    @Body() updateMetricDto: UpdateMetricDto,
    @Request() req: { user: JwtPayload },
  ): Promise<MetricDefinition> {
    return this.metricsService.update(
      id,
      moduleId,
      req.user.activeDepartmentId,
      updateMetricDto,
      req.user.userId,
    );
  }

  @Delete(':id')
  async delete(
    @Param('moduleId') moduleId: string,
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<void> {
    return this.metricsService.delete(
      id,
      moduleId,
      req.user.activeDepartmentId,
      req.user.userId,
    );
  }

  @Post('calculate-values')
  async calculateMetrics(
    @Param('moduleId') moduleId: string,
    @Body() body: { filters?: Record<string, unknown> },
    @Request() req: { user: JwtPayload },
  ): Promise<Record<string, unknown>> {
    return this.metricsService.calculateMetrics(
      moduleId,
      req.user.activeDepartmentId,
      body.filters,
    );
  }
}
