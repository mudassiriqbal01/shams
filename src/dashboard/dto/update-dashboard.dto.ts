import { IsString, IsOptional, IsArray, IsObject, IsBoolean } from 'class-validator';

export class UpdateDashboardDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  pinnedMetrics?: Array<{
    id: string;
    name: string;
    formula: string;
    moduleType: string;
    position: number;
  }>;

  @IsOptional()
  @IsObject()
  metaFormulas?: Record<string, {
    formula: string;
    dependencies: string[];
    cacheDuration: number;
  }>;

  @IsOptional()
  @IsObject()
  filters?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
