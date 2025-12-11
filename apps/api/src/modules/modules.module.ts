import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModulesService } from './modules.service';
import { ModulesController } from './modules.controller';
import { ColumnsService } from './columns.service';
import { ColumnsController } from './columns.controller';
import { RowsService } from './rows.service';
import { RowsController } from './rows.controller';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { FormulaEngine } from '../formula/formula.engine';
import {
  Module as ModuleEntity,
  AuditLog,
  Column,
  Row,
  MetricDefinition,
  ImportJob,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ModuleEntity,
      AuditLog,
      Column,
      Row,
      MetricDefinition,
      ImportJob,
    ]),
  ],
  controllers: [
    ModulesController,
    ColumnsController,
    RowsController,
    MetricsController,
    ImportController,
  ],
  providers: [
    ModulesService,
    ColumnsService,
    RowsService,
    MetricsService,
    ImportService,
    FormulaEngine,
  ],
  exports: [
    ModulesService,
    ColumnsService,
    RowsService,
    MetricsService,
    ImportService,
    FormulaEngine,
  ],
})
export class ModulesModule {}
