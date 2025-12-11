import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MetricDefinition,
  MetricType,
} from '../database/entities/metric-definition.entity';
import { Module } from '../database/entities/module.entity';
import { Column } from '../database/entities/column.entity';
import { Row } from '../database/entities/row.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { CreateMetricDto } from './dto/create-metric.dto';
import { UpdateMetricDto } from './dto/update-metric.dto';
import { FormulaEngine } from '../formula/formula.engine';

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(MetricDefinition)
    private metricRepository: Repository<MetricDefinition>,
    @InjectRepository(Module)
    private moduleRepository: Repository<Module>,
    @InjectRepository(Column)
    private columnRepository: Repository<Column>,
    @InjectRepository(Row)
    private rowRepository: Repository<Row>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private formulaEngine: FormulaEngine,
  ) {}

  async create(
    moduleId: string,
    departmentId: string,
    createMetricDto: CreateMetricDto,
    userId: string,
  ): Promise<MetricDefinition> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId, departmentId },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    const metric = this.metricRepository.create({
      ...createMetricDto,
      moduleId,
      version: 1,
    });

    const savedMetric = await this.metricRepository.save(metric);

    await this.auditLogRepository.save({
      entityType: 'MetricDefinition',
      entityId: savedMetric.id,
      action: 'CREATE',
      userId,
      departmentId,
      changes: {
        created: true,
        name: savedMetric.name,
        type: savedMetric.type,
      },
    });

    return savedMetric;
  }

  async findOne(
    id: string,
    moduleId: string,
    departmentId: string,
  ): Promise<MetricDefinition> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId, departmentId },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    const metric = await this.metricRepository.findOne({
      where: { id, moduleId },
    });

    if (!metric) {
      throw new NotFoundException('Metric not found');
    }

    return metric;
  }

  async findAll(
    moduleId: string,
    departmentId: string,
  ): Promise<MetricDefinition[]> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId, departmentId },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    return this.metricRepository.find({
      where: { moduleId, isVisible: true },
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    moduleId: string,
    departmentId: string,
    updateMetricDto: UpdateMetricDto,
    userId: string,
  ): Promise<MetricDefinition> {
    const metric = await this.findOne(id, moduleId, departmentId);

    if (updateMetricDto.version !== metric.version) {
      throw new ConflictException('Version mismatch - data has been modified');
    }

    const oldValues = { ...metric };

    if (updateMetricDto.name !== undefined) {
      metric.name = updateMetricDto.name;
    }
    if (updateMetricDto.description !== undefined) {
      metric.description = updateMetricDto.description;
    }
    if (updateMetricDto.type !== undefined) {
      metric.type = updateMetricDto.type;
    }
    if (updateMetricDto.columnId !== undefined) {
      metric.columnId = updateMetricDto.columnId;
    }
    if (updateMetricDto.order !== undefined) {
      metric.order = updateMetricDto.order;
    }
    if (updateMetricDto.aggregationExpression !== undefined) {
      metric.aggregationExpression = updateMetricDto.aggregationExpression;
    }
    if (updateMetricDto.isVisible !== undefined) {
      metric.isVisible = updateMetricDto.isVisible;
    }

    metric.version += 1;

    const updatedMetric = await this.metricRepository.save(metric);

    const changes: Record<string, unknown> = {};
    Object.keys(updateMetricDto).forEach((key) => {
      if (key !== 'version' && oldValues[key as keyof MetricDefinition] !== (updateMetricDto as any)[key]) {
        changes[key] = {
          old: oldValues[key as keyof MetricDefinition],
          new: (updateMetricDto as any)[key],
        };
      }
    });

    if (Object.keys(changes).length > 0) {
      await this.auditLogRepository.save({
        entityType: 'MetricDefinition',
        entityId: id,
        action: 'UPDATE',
        userId,
        departmentId,
        changes,
      });
    }

    return updatedMetric;
  }

  async delete(
    id: string,
    moduleId: string,
    departmentId: string,
    userId: string,
  ): Promise<void> {
    const metric = await this.findOne(id, moduleId, departmentId);

    await this.auditLogRepository.save({
      entityType: 'MetricDefinition',
      entityId: id,
      action: 'DELETE',
      userId,
      departmentId,
      changes: { deleted: true, name: metric.name, type: metric.type },
    });

    await this.metricRepository.remove(metric);
  }

  async calculateMetrics(
    moduleId: string,
    departmentId: string,
    filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId, departmentId },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    const metrics = await this.metricRepository.find({
      where: { moduleId, isVisible: true },
    });

    let query = this.rowRepository.createQueryBuilder('row')
      .where('row.moduleId = :moduleId', { moduleId });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.andWhere(`row.values->>'${key}' = :${key}`, { [key]: String(value) });
      });
    }

    const rows = await query.getMany();
    const results: Record<string, unknown> = {};

    for (const metric of metrics) {
      try {
        results[metric.id] = await this.calculateSingleMetric(metric, rows);
      } catch (error: any) {
        results[metric.id] = null;
      }
    }

    return results;
  }

  private async calculateSingleMetric(
    metric: MetricDefinition,
    rows: Row[],
  ): Promise<unknown> {
    switch (metric.type) {
      case MetricType.COUNT:
        return rows.length;

      case MetricType.SUM:
        if (!metric.columnId) {
          throw new BadRequestException('SUM metric requires columnId');
        }
        return rows.reduce((sum, row) => {
          const value = row.values[metric.columnId!];
          return sum + (typeof value === 'number' ? value : 0);
        }, 0);

      case MetricType.AVG:
        if (!metric.columnId) {
          throw new BadRequestException('AVG metric requires columnId');
        }
        if (rows.length === 0) return 0;
        const sum = rows.reduce((s, row) => {
          const value = row.values[metric.columnId!];
          return s + (typeof value === 'number' ? value : 0);
        }, 0);
        return sum / rows.length;

      case MetricType.CUSTOM:
        if (!metric.aggregationExpression) {
          throw new BadRequestException(
            'CUSTOM metric requires aggregationExpression',
          );
        }
        return this.calculateCustomMetric(
          metric.aggregationExpression,
          rows,
        );

      default:
        throw new BadRequestException(`Unknown metric type: ${metric.type}`);
    }
  }

  private calculateCustomMetric(
    expression: Record<string, unknown>,
    rows: Row[],
  ): unknown {
    if (expression.type === 'formula' && typeof expression.formula === 'string') {
      const context: Record<string, unknown> = {
        count: rows.length,
        rows: rows.map((r) => r.values),
      };

      return this.formulaEngine.evaluateFormula(expression.formula, context);
    }

    return null;
  }
}
