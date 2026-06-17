import { IsString, IsInt, IsOptional, IsObject } from 'class-validator';

export class NetworkDto {
  @IsString()
  ipAddress: string;

  @IsString()
  userAgent: string;
}

export class EvaluateRequestDto {
  @IsString()
  requestId: string;

  @IsString()
  tenantId: string;

  @IsString()
  userId: string;

  @IsString()
  sessionId: string;

  @IsInt()
  targetSecurityLevel: number;

  @IsString()
  actionType: string;

  @IsString()
  productName: string;

  @IsString()
  @IsOptional()
  featureName?: string;

  @IsString()
  deviceFingerprint: string;

  @IsObject()
  network: NetworkDto;

  @IsObject()
  @IsOptional()
  actionMetadata?: Record<string, any>;
}
