import { IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @IsString()
  identifier: string; // email or username

  @IsString()
  password: string;

  @IsString()
  @IsOptional()
  fingerprint?: string; // Optional device fingerprint
}

export class RefreshDto {
  @IsString()
  refreshToken: string; // format: sessionId:tokenValue
}
