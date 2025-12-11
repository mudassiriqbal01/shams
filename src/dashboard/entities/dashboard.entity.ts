import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('dashboards')
export class Dashboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  userId: string;

  @Column({ type: 'jsonb', default: [] })
  pinnedMetrics: Array<{
    id: string;
    name: string;
    formula: string;
    moduleType: string;
    position: number;
  }>;

  @Column({ type: 'jsonb', default: {} })
  metaFormulas: Record<string, {
    formula: string;
    dependencies: string[];
    cacheDuration: number;
  }>;

  @Column({ type: 'jsonb', default: {} })
  filters: any;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
