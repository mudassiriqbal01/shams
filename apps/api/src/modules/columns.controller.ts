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
} from '@nestjs/common';
import { ColumnsService } from './columns.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentRlsGuard } from '../auth/guards/department-rls.guard';
import { JwtPayload } from '@shams-vision/shared';
import { Column } from '../database/entities/column.entity';

@Controller('modules/:moduleId/columns')
@UseGuards(JwtAuthGuard, DepartmentRlsGuard)
export class ColumnsController {
  constructor(private columnsService: ColumnsService) {}

  @Post()
  async create(
    @Param('moduleId') moduleId: string,
    @Body() createColumnDto: CreateColumnDto,
    @Request() req: { user: JwtPayload },
  ): Promise<Column> {
    return this.columnsService.create(
      moduleId,
      req.user.activeDepartmentId,
      createColumnDto,
      req.user.userId,
    );
  }

  @Get()
  async findAll(
    @Param('moduleId') moduleId: string,
    @Request() req: { user: JwtPayload },
  ): Promise<Column[]> {
    return this.columnsService.findAll(
      moduleId,
      req.user.activeDepartmentId,
    );
  }

  @Get(':id')
  async findOne(
    @Param('moduleId') moduleId: string,
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<Column> {
    return this.columnsService.findOne(
      id,
      moduleId,
      req.user.activeDepartmentId,
    );
  }

  @Put(':id')
  async update(
    @Param('moduleId') moduleId: string,
    @Param('id') id: string,
    @Body() updateColumnDto: UpdateColumnDto,
    @Request() req: { user: JwtPayload },
  ): Promise<Column> {
    return this.columnsService.update(
      id,
      moduleId,
      req.user.activeDepartmentId,
      updateColumnDto,
      req.user.userId,
    );
  }

  @Delete(':id')
  async delete(
    @Param('moduleId') moduleId: string,
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<void> {
    return this.columnsService.delete(
      id,
      moduleId,
      req.user.activeDepartmentId,
      req.user.userId,
    );
  }

  @Post('reorder')
  async reorderColumns(
    @Param('moduleId') moduleId: string,
    @Body() body: { columnIds: string[] },
    @Request() req: { user: JwtPayload },
  ): Promise<Column[]> {
    return this.columnsService.reorderColumns(
      moduleId,
      req.user.activeDepartmentId,
      body.columnIds,
      req.user.userId,
    );
  }
}
