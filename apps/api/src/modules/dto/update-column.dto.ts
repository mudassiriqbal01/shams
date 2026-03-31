import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsArray, IsObject, ValidateNested, Min, Max, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ColumnType, PermissionType } from '@shams-vision/shared';

class ValidationRuleDto {
  @IsOptional()
  @IsNumber()
  min?: number;

  @IsOptional()
  @IsNumber()
  max?: number;

  @IsOptional()
  @Matches(/^.*$/)
  pattern?: string;

  @IsOptional()
  @IsString()
  message?: string;
}

class ColumnOptionDto {
  @IsString()
  label: string;

  @IsObject()
  value: unknown;
}

class ColumnPermissionsDto {
  @IsOptional()
  @IsArray()
  @IsEnum(PermissionType, { each: true })
  view?: PermissionType[];

  @IsOptional()
  @IsArray()
  @IsEnum(PermissionType, { each: true })
  edit?: PermissionType[];

  @IsOptional()
  @IsArray()
  @IsEnum(PermissionType, { each: true })
  export?: PermissionType[];
}

export class UpdateColumnDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @IsEnum(ColumnType)
  type?: ColumnType;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(1000)
  minWidth?: number;

  @IsOptional()
  @IsNumber()
  maxWidth?: number;

  @IsOptional()
  @IsBoolean()
  resizable?: boolean;

  @IsOptional()
  @IsBoolean()
  sortable?: boolean;

  @IsOptional()
  @IsBoolean()
  filterable?: boolean;

  @IsOptional()
  @IsEnum(['left', 'right'])
  pinned?: 'left' | 'right';

  @IsOptional()
  @IsBoolean()
  editable?: boolean;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsBoolean()
  unique?: boolean;

  @IsOptional()
  defaultValue?: unknown;

  @IsOptional()
  @ValidateNested()
  @Type(() => ValidationRuleDto)
  validation?: ValidationRuleDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnOptionDto)
  options?: ColumnOptionDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ColumnPermissionsDto)
  permissions?: ColumnPermissionsDto;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  hidden?: boolean;

  @IsOptional()
  @IsString()
  headerName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  version: number;
}