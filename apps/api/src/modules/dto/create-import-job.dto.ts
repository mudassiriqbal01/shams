import { IsString, IsOptional } from 'class-validator';

export class CreateImportJobDto {
  @IsString()
  originalFileName: string;

  @IsOptional()
  @IsString()
  csvData?: string;
}
