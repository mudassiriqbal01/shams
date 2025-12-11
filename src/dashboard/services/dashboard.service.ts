import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dashboard } from '../entities/dashboard.entity';
import { MetricCache } from '../entities/metric-cache.entity';
import { CreateDashboardDto } from '../dto/create-dashboard.dto';
import { UpdateDashboardDto } from '../dto/update-dashboard.dto';
import { addMinutes, isBefore } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Dashboard)
    private dashboardRepository: Repository<Dashboard>,
    @InjectRepository(MetricCache)
    private metricCacheRepository: Repository<MetricCache>,
  ) {}

  async create(createDashboardDto: CreateDashboardDto, userId: string): Promise<Dashboard> {
    const dashboard = this.dashboardRepository.create({
      ...createDashboardDto,
      userId,
    });

    return this.dashboardRepository.save(dashboard);
  }

  async findAll(userId: string, userRoles: string[]): Promise<Dashboard[]> {
    const query = this.dashboardRepository
      .createQueryBuilder('dashboard')
      .where('dashboard.isActive = :isActive', { isActive: true });

    if (!userRoles.includes('admin')) {
      query.andWhere('dashboard.userId = :userId', { userId });
    }

    return query.getMany();
  }

  async findOne(id: string, userId: string, userRoles: string[]): Promise<Dashboard> {
    const dashboard = await this.dashboardRepository.findOne({
      where: { id, isActive: true },
    });

    if (!dashboard) {
      throw new NotFoundException(`Dashboard with ID ${id} not found`);
    }

    if (!userRoles.includes('admin') && dashboard.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this dashboard');
    }

    return dashboard;
  }

  async update(
    id: string,
    updateDashboardDto: UpdateDashboardDto,
    userId: string,
    userRoles: string[],
  ): Promise<Dashboard> {
    const dashboard = await this.findOne(id, userId, userRoles);

    Object.assign(dashboard, updateDashboardDto);

    return this.dashboardRepository.save(dashboard);
  }

  async remove(id: string, userId: string, userRoles: string[]): Promise<void> {
    const dashboard = await this.findOne(id, userId, userRoles);
    dashboard.isActive = false;
    await this.dashboardRepository.save(dashboard);
  }

  async getMetrics(
    dashboardId: string,
    userId: string,
    userRoles: string[],
    filters?: any,
  ): Promise<any> {
    const dashboard = await this.findOne(dashboardId, userId, userRoles);

    const metrics = {};

    for (const pinnedMetric of dashboard.pinnedMetrics) {
      const cachedValue = await this.getCachedMetric(
        pinnedMetric.moduleType,
        pinnedMetric.id,
        filters,
      );

      if (cachedValue) {
        metrics[pinnedMetric.id] = cachedValue;
      } else {
        const calculatedValue = await this.calculateMetric(
          pinnedMetric,
          filters,
          userId,
          userRoles,
        );
        metrics[pinnedMetric.id] = calculatedValue;

        await this.cacheMetric(
          pinnedMetric.moduleType,
          pinnedMetric.id,
          calculatedValue,
          filters,
        );
      }
    }

    for (const [key, metaFormula] of Object.entries(dashboard.metaFormulas)) {
      metrics[key] = this.evaluateMetaFormula(metaFormula, metrics);
    }

    return {
      dashboardId,
      metrics,
      lastUpdated: new Date(),
    };
  }

  private async getCachedMetric(
    moduleType: string,
    metricKey: string,
    filters: any,
  ): Promise<any | null> {
    const cached = await this.metricCacheRepository.findOne({
      where: {
        moduleType,
        metricKey,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!cached) {
      return null;
    }

    if (isBefore(new Date(cached.expiresAt), new Date())) {
      await this.metricCacheRepository.remove(cached);
      return null;
    }

    return cached.value;
  }

  private async cacheMetric(
    moduleType: string,
    metricKey: string,
    value: any,
    filters: any,
    cacheDurationMinutes: number = 5,
  ): Promise<void> {
    const cache = this.metricCacheRepository.create({
      moduleType,
      metricKey,
      value,
      filters: filters || {},
      expiresAt: addMinutes(new Date(), cacheDurationMinutes),
    });

    await this.metricCacheRepository.save(cache);
  }

  private async calculateMetric(
    metric: any,
    filters: any,
    userId: string,
    userRoles: string[],
  ): Promise<any> {
    return {
      value: Math.floor(Math.random() * 1000),
      label: metric.name,
      timestamp: new Date(),
    };
  }

  private evaluateMetaFormula(metaFormula: any, metrics: Record<string, any>): any {
    try {
      const formula = metaFormula.formula;
      let result = formula;

      for (const dep of metaFormula.dependencies) {
        if (metrics[dep]) {
          const value = typeof metrics[dep] === 'object' ? metrics[dep].value : metrics[dep];
          result = result.replace(new RegExp(`\\b${dep}\\b`, 'g'), value);
        }
      }

      return {
        value: eval(result),
        formula: metaFormula.formula,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        value: null,
        error: 'Failed to evaluate formula',
        timestamp: new Date(),
      };
    }
  }

  async clearExpiredCache(): Promise<void> {
    await this.metricCacheRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();
  }
}
