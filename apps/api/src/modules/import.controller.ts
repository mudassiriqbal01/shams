import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ImportService } from './import.service';
import { CreateImportJobDto } from './dto/create-import-job.dto';
import { ConfirmImportDto } from './dto/confirm-import.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentRlsGuard } from '../auth/guards/department-rls.guard';
import { JwtPayload } from '@shams-vision/shared';
import { ImportJob } from '../database/entities/import-job.entity';

@Controller('modules/:moduleId/import')
@UseGuards(JwtAuthGuard, DepartmentRlsGuard)
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post('jobs')
  async createImportJob(
    @Param('moduleId') moduleId: string,
    @Body() createImportJobDto: CreateImportJobDto,
    @Request() req: { user: JwtPayload },
  ): Promise<ImportJob> {
    return this.importService.createImportJob(
      moduleId,
      req.user.activeDepartmentId,
      createImportJobDto,
      req.user.userId,
    );
  }

  @Get('jobs/:jobId')
  async getImportJob(
    @Param('moduleId') moduleId: string,
    @Param('jobId') jobId: string,
    @Request() req: { user: JwtPayload },
  ): Promise<ImportJob> {
    return this.importService.getImportJob(
      jobId,
      moduleId,
      req.user.activeDepartmentId,
    );
  }

  @Post('jobs/:jobId/confirm')
  async confirmImport(
    @Param('moduleId') moduleId: string,
    @Param('jobId') jobId: string,
    @Body() confirmImportDto: ConfirmImportDto,
    @Request() req: { user: JwtPayload },
  ): Promise<ImportJob> {
    return this.importService.confirmImport(
      jobId,
      moduleId,
      req.user.activeDepartmentId,
      confirmImportDto,
      req.user.userId,
    );
  }

  @Post('jobs/:jobId/execute')
  async executeImport(
    @Param('moduleId') moduleId: string,
    @Param('jobId') jobId: string,
    @Request() req: { user: JwtPayload },
  ): Promise<ImportJob> {
    return this.importService.executeImport(
      jobId,
      moduleId,
      req.user.activeDepartmentId,
      req.user.userId,
    );
  }
}
