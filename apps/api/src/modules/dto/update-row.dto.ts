import { IsObject, IsNumber } from 'class-validator';

export class UpdateRowDto {
  @IsObject()
  values: Record<string, unknown>;

  @IsNumber()
  version: number;
}
