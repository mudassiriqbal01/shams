import { IsString, IsOptional, IsEnum, IsBoolean, IsDateString, IsUUID } from 'class-validator';
import { TaskStatus, RecurrenceInterval } from '../entities/task.entity';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsString()
  moduleType: string;

  @IsString()
  moduleRecordId: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsEnum(RecurrenceInterval)
  recurrenceInterval?: RecurrenceInterval;

  @IsOptional()
  recurrenceRule?: any;
}
