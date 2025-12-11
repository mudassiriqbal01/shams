import { IsObject, IsOptional } from 'class-validator';

export class CreateRowDto {
  @IsObject()
  values: Record<string, unknown>;
}
