import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './services/task.service';
import { TaskSchedulerService } from './services/task-scheduler.service';
import { TaskController } from './controllers/task.controller';
import { Task } from './entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  controllers: [TaskController],
  providers: [TaskService, TaskSchedulerService],
  exports: [TaskService],
})
export class TasksModule {}
