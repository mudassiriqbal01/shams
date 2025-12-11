import { IsArray, IsNumber, IsString, IsOptional, ValidateNested, Type } from 'class-validator';

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
}
