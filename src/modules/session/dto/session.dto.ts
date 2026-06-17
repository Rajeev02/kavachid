import { IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @IsString()
  identifier: string; // email or username

  @IsString()
  password: string;

  @IsString()
  @IsOptional()
  fingerprint?: string; // Optional device fingerprint

  @IsString()
  @IsOptional()
  clientId?: string;
}

export class RefreshDto {
  @IsString()
  refreshToken: string; // format: sessionId:tokenValue

  @IsString()
  @IsOptional()
  clientId?: string;
}

export class SsoConsentDto {
  @IsString()
  refreshToken: string;

  @IsString()
  clientId: string;
}
