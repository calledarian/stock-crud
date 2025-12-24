import { IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsEnum(['admin', 'worker'])
  role?: 'admin' | 'worker';
}