import { IsString, IsEnum, IsOptional, IsObject, IsBoolean, IsNumber } from 'class-validator';
import { ColumnType } from '../../database/entities/column.entity';

export class UpdateColumnDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ColumnType)
  type?: ColumnType;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsObject()
  validationRules?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  formula?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsNumber()
  version: number;
}
