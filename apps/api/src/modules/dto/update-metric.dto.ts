import { IsString, IsEnum, IsOptional, IsObject, IsBoolean, IsNumber } from 'class-validator';
import { MetricType } from '../../database/entities/metric-definition.entity';

export class UpdateMetricDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(MetricType)
  type?: MetricType;

  @IsOptional()
  @IsString()
  columnId?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsObject()
  aggregationExpression?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsNumber()
  version: number;
}
