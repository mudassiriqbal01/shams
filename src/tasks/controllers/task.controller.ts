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
import { TaskService } from '../services/task.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.taskService.create(createTaskDto, req.user.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.taskService.findAll(req.user.id, req.user.roles || []);
  }

  @Get('module/:moduleType/:moduleRecordId')
  findByModule(
    @Param('moduleType') moduleType: string,
    @Param('moduleRecordId') moduleRecordId: string,
    @Request() req,
  ) {
    return this.taskService.findByModuleRecord(
      moduleType,
      moduleRecordId,
      req.user.id,
      req.user.roles || [],
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.taskService.findOne(id, req.user.id, req.user.roles || []);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req,
  ) {
    return this.taskService.update(id, updateTaskDto, req.user.id, req.user.roles || []);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.taskService.remove(id, req.user.id, req.user.roles || []);
  }
}
