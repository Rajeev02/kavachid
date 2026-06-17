import { IsString, IsOptional } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreatePermissionDto {
  @IsString()
  resource: string;

  @IsString()
  action: string;
}

export class AssignPermissionDto {
  @IsString()
  permissionId: string;
}

export class AssignRoleDto {
  @IsString()
  roleId: string;
}
