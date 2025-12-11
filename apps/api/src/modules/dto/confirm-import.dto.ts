import { IsArray, IsNumber, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ColumnMappingDto {
  @IsNumber()
  csvColumnIndex: number;

  @IsString()
  csvColumnName: string;

  @IsOptional()
  @IsString()
  moduleColumnId?: string;

  @IsOptional()
  @IsString()
  moduleColumnName?: string;

  @IsOptional()
  @IsString()
  type?: string;
}

export class ConfirmImportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnMappingDto)
  columnMapping: ColumnMappingDto[];

  @IsOptional()
  @IsString()
  duplicateHandling?: 'IGNORE' | 'SKIP' | 'UPDATE' | 'ERROR';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deduplicationColumns?: string[];
}
