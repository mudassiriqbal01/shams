import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum RecurrenceInterval {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ nullable: true })
  assigneeId: string;

  @Column({ nullable: true })
  createdById: string;

  @Column()
  moduleType: string;

  @Column()
  moduleRecordId: string;

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({
    type: 'enum',
    enum: RecurrenceInterval,
    default: RecurrenceInterval.NONE,
  })
  recurrenceInterval: RecurrenceInterval;

  @Column({ type: 'jsonb', nullable: true })
  recurrenceRule: any;

  @Column({ nullable: true })
  parentTaskId: string;

  @ManyToOne(() => Task, { nullable: true })
  @JoinColumn({ name: 'parentTaskId' })
  parentTask: Task;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  completedById: string;

  @Column({ type: 'jsonb', default: [] })
  auditTrail: Array<{
    timestamp: Date;
    userId: string;
    action: string;
    changes: any;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;
}
