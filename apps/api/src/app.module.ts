import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { DepartmentsModule } from './departments/departments.module';
import { ModulesModule } from './modules/modules.module';
import { RolesModule } from './roles/roles.module';
import { appConfig, jwtConfig, databaseConfig } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, jwtConfig, databaseConfig],
    }),
    DatabaseModule,
    AuthModule,
    DepartmentsModule,
    ModulesModule,
    RolesModule,
  ],
})
export class AppModule {}
