import { DataSource } from 'typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/shams_vision',
  entities: [path.join(__dirname, '/entities/*.entity.{ts,js}')],
  migrations: [path.join(__dirname, '/migrations/*.{ts,js}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  migrationsRun: false,
});
