import { IsString, IsEnum, IsOptional, IsObject, IsBoolean, IsNumber } from 'class-validator';
import { MetricType } from '../../database/entities/metric-definition.entity';

export class CreateMetricDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(MetricType)
  type: MetricType;

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
}
