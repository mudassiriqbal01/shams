import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TaskService } from './task.service';

@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(private readonly taskService: TaskService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyRollover() {
    this.logger.log('Starting daily task rollover...');
    
    try {
      const overdueCount = await this.taskService.markOverdueTasks();
      this.logger.log(`Marked ${overdueCount} tasks as overdue`);

      await this.taskService.rolloverTasks();
      this.logger.log('Task rollover completed successfully');
    } catch (error) {
      this.logger.error('Error during task rollover', error);
    }
  }
}
