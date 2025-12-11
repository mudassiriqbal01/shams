import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('metric_cache')
@Index(['moduleType', 'metricKey'])
export class MetricCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  moduleType: string;

  @Column()
  metricKey: string;

  @Column({ type: 'jsonb' })
  value: any;

  @Column({ type: 'jsonb', default: {} })
  filters: any;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
