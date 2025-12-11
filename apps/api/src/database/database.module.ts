import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ENTITIES } from './entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: ENTITIES,
        synchronize: false,
        logging: configService.get('NODE_ENV') === 'development',
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: true,
      }),
    }),
    TypeOrmModule.forFeature(ENTITIES),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
