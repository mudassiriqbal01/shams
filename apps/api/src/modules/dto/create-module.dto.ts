import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateModuleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
