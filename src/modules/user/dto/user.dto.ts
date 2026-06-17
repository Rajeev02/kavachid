import { IsEmail, IsString, IsOptional, MinLength, IsObject } from 'class-validator';

export class RegisterUserDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsOptional()
  password?: string;

  @IsObject()
  @IsOptional()
  metadata?: any;
}

export class VerifyCredentialsDto {
  @IsString()
  identifier: string; // email or username

  @IsString()
  password: string;
}
