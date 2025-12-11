import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Task, TaskStatus, RecurrenceInterval } from '../entities/task.entity';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { addDays, addWeeks, addMonths, isBefore, startOfDay } from 'date-fns';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      createdById: userId,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
      auditTrail: [
        {
          timestamp: new Date(),
          userId,
          action: 'created',
          changes: createTaskDto,
        },
      ],
    });

    const savedTask = await this.taskRepository.save(task);

    if (task.isRecurring && task.recurrenceInterval !== RecurrenceInterval.NONE) {
      await this.generateRecurringInstances(savedTask, userId);
    }

    return savedTask;
  }

  async findAll(userId: string, userRoles: string[]): Promise<Task[]> {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .where('task.isDeleted = :isDeleted', { isDeleted: false });

    if (!userRoles.includes('admin')) {
      query.andWhere('(task.assigneeId = :userId OR task.createdById = :userId)', { userId });
    }

    return query.getMany();
  }

  async findOne(id: string, userId: string, userRoles: string[]): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['parentTask'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    if (!userRoles.includes('admin') && task.assigneeId !== userId && task.createdById !== userId) {
      throw new ForbiddenException('You do not have permission to view this task');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string, userRoles: string[]): Promise<Task> {
    const task = await this.findOne(id, userId, userRoles);

    const auditEntry = {
      timestamp: new Date(),
      userId,
      action: 'updated',
      changes: updateTaskDto,
    };

    const updatedTask = {
      ...task,
      ...updateTaskDto,
      dueDate: updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : task.dueDate,
      auditTrail: [...task.auditTrail, auditEntry],
    };

    if (updateTaskDto.status === TaskStatus.COMPLETED && !task.completedAt) {
      updatedTask.completedAt = new Date();
      updatedTask.completedById = userId;
    }

    return this.taskRepository.save(updatedTask);
  }

  async remove(id: string, userId: string, userRoles: string[]): Promise<void> {
    const task = await this.findOne(id, userId, userRoles);

    const auditEntry = {
      timestamp: new Date(),
      userId,
      action: 'deleted',
      changes: {},
    };

    task.isDeleted = true;
    task.auditTrail = [...task.auditTrail, auditEntry];

    await this.taskRepository.save(task);
  }

  async markOverdueTasks(): Promise<number> {
    const now = startOfDay(new Date());
    const result = await this.taskRepository
      .createQueryBuilder()
      .update(Task)
      .set({ status: TaskStatus.OVERDUE })
      .where('dueDate < :now', { now })
      .andWhere('status IN (:...statuses)', { statuses: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] })
      .andWhere('isDeleted = :isDeleted', { isDeleted: false })
      .execute();

    return result.affected || 0;
  }

  async rolloverTasks(): Promise<void> {
    const overdueTasks = await this.taskRepository.find({
      where: {
        status: TaskStatus.OVERDUE,
        isDeleted: false,
      },
    });

    for (const task of overdueTasks) {
      const auditEntry = {
        timestamp: new Date(),
        userId: 'system',
        action: 'rollover',
        changes: { oldDueDate: task.dueDate, newDueDate: new Date() },
      };

      task.dueDate = new Date();
      task.status = TaskStatus.TODO;
      task.auditTrail = [...task.auditTrail, auditEntry];

      await this.taskRepository.save(task);
    }
  }

  private async generateRecurringInstances(task: Task, userId: string): Promise<void> {
    const instances: Partial<Task>[] = [];
    let nextDate = new Date(task.dueDate);

    for (let i = 0; i < 12; i++) {
      nextDate = this.calculateNextOccurrence(nextDate, task.recurrenceInterval, task.recurrenceRule);

      if (!nextDate) break;

      instances.push({
        title: task.title,
        description: task.description,
        status: TaskStatus.TODO,
        dueDate: nextDate,
        assigneeId: task.assigneeId,
        createdById: userId,
        moduleType: task.moduleType,
        moduleRecordId: task.moduleRecordId,
        isRecurring: true,
        recurrenceInterval: task.recurrenceInterval,
        recurrenceRule: task.recurrenceRule,
        parentTaskId: task.id,
        auditTrail: [
          {
            timestamp: new Date(),
            userId: 'system',
            action: 'generated_recurring',
            changes: { parentTaskId: task.id },
          },
        ],
      });
    }

    if (instances.length > 0) {
      await this.taskRepository.save(instances);
    }
  }

  private calculateNextOccurrence(currentDate: Date, interval: RecurrenceInterval, rule: any): Date | null {
    switch (interval) {
      case RecurrenceInterval.DAILY:
        return addDays(currentDate, rule?.every || 1);

      case RecurrenceInterval.WEEKLY:
        return addWeeks(currentDate, rule?.every || 1);

      case RecurrenceInterval.MONTHLY:
        return addMonths(currentDate, rule?.every || 1);

      case RecurrenceInterval.CUSTOM:
        if (rule?.dayOfWeek !== undefined && rule?.weekOfMonth !== undefined) {
          return this.calculateNthWeekdayOfMonth(currentDate, rule.weekOfMonth, rule.dayOfWeek);
        }
        return addDays(currentDate, rule?.every || 1);

      default:
        return null;
    }
  }

  private calculateNthWeekdayOfMonth(baseDate: Date, weekNumber: number, dayOfWeek: number): Date {
    const nextMonth = addMonths(baseDate, 1);
    const firstDayOfMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    const firstWeekday = firstDayOfMonth.getDay();
    
    const daysToAdd = (dayOfWeek - firstWeekday + 7) % 7;
    const firstOccurrence = addDays(firstDayOfMonth, daysToAdd);
    
    return addWeeks(firstOccurrence, weekNumber - 1);
  }

  async findByModuleRecord(moduleType: string, moduleRecordId: string, userId: string, userRoles: string[]): Promise<Task[]> {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .where('task.moduleType = :moduleType', { moduleType })
      .andWhere('task.moduleRecordId = :moduleRecordId', { moduleRecordId })
      .andWhere('task.isDeleted = :isDeleted', { isDeleted: false });

    if (!userRoles.includes('admin')) {
      query.andWhere('(task.assigneeId = :userId OR task.createdById = :userId)', { userId });
    }

    return query.getMany();
  }
}
