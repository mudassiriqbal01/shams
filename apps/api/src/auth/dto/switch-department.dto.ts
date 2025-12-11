import { IsUUID } from 'class-validator';

export class SwitchDepartmentDto {
  @IsUUID()
  departmentId: string;
}
