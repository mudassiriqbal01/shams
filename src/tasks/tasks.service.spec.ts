import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskService } from './services/task.service';
import { Task, TaskStatus, RecurrenceInterval } from './entities/task.entity';

describe('TaskService', () => {
  let service: TaskService;
  let repository: Repository<Task>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    repository = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task', async () => {
      const createTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        moduleType: 'project',
        moduleRecordId: 'proj-001',
      };

      const mockTask = {
        id: '123',
        ...createTaskDto,
        status: TaskStatus.TODO,
        isRecurring: false,
        recurrenceInterval: RecurrenceInterval.NONE,
        auditTrail: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockTask);
      mockRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(createTaskDto, 'user-123');

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockTask);
    });
  });

  describe('findAll', () => {
    it('should return tasks for non-admin user', async () => {
      const userId = 'user-123';
      const userRoles = ['user'];
      const mockTasks = [
        { id: '1', title: 'Task 1', assigneeId: userId },
        { id: '2', title: 'Task 2', createdById: userId },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockTasks),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(userId, userRoles);

      expect(result).toEqual(mockTasks);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should return all tasks for admin user', async () => {
      const userId = 'admin-123';
      const userRoles = ['admin'];
      const mockTasks = [
        { id: '1', title: 'Task 1' },
        { id: '2', title: 'Task 2' },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockTasks),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(userId, userRoles);

      expect(result).toEqual(mockTasks);
    });
  });

  describe('markOverdueTasks', () => {
    it('should mark tasks as overdue', async () => {
      const mockExecuteResult = { affected: 5 };

      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockExecuteResult),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.markOverdueTasks();

      expect(result).toBe(5);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({ status: TaskStatus.OVERDUE });
    });
  });
});
