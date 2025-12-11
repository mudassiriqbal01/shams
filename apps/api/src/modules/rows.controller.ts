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
import { RowsService } from './rows.service';
import { CreateRowDto } from './dto/create-row.dto';
import { UpdateRowDto } from './dto/update-row.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentRlsGuard } from '../auth/guards/department-rls.guard';
import { JwtPayload } from '@shams-vision/shared';
import { Row } from '../database/entities/row.entity';

@Controller('modules/:moduleId/rows')
@UseGuards(JwtAuthGuard, DepartmentRlsGuard)
export class RowsController {
  constructor(private rowsService: RowsService) {}

  @Post()
  async create(
    @Param('moduleId') moduleId: string,
    @Body() createRowDto: CreateRowDto,
    @Request() req: { user: JwtPayload },
  ): Promise<Row> {
    return this.rowsService.create(
      moduleId,
      req.user.activeDepartmentId,
      createRowDto,
      req.user.userId,
    );
  }

  @Get()
  async findAll(
    @Param('moduleId') moduleId: string,
    @Request() req: { user: JwtPayload },
  ): Promise<Row[]> {
    return this.rowsService.findAll(
      moduleId,
      req.user.activeDepartmentId,
    );
  }

  @Get(':id')
  async findOne(
    @Param('moduleId') moduleId: string,
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<Row> {
    return this.rowsService.findOne(
      id,
      moduleId,
      req.user.activeDepartmentId,
    );
  }

  @Put(':id')
  async update(
    @Param('moduleId') moduleId: string,
    @Param('id') id: string,
    @Body() updateRowDto: UpdateRowDto,
    @Request() req: { user: JwtPayload },
  ): Promise<Row> {
    return this.rowsService.update(
      id,
      moduleId,
      req.user.activeDepartmentId,
      updateRowDto,
      req.user.userId,
    );
  }

  @Delete(':id')
  async delete(
    @Param('moduleId') moduleId: string,
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<void> {
    return this.rowsService.delete(
      id,
      moduleId,
      req.user.activeDepartmentId,
      req.user.userId,
    );
  }
}
