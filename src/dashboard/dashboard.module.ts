import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './services/dashboard.service';
import { DashboardController } from './controllers/dashboard.controller';
import { Dashboard } from './entities/dashboard.entity';
import { MetricCache } from './entities/metric-cache.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Dashboard, MetricCache])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
