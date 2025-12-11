import { IsEmail, IsString, MinLength, IsUUID } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsUUID()
  departmentId: string;
}
