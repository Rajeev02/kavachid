import { Controller, Post, Get, Body, Param, UseGuards, ValidationPipe, UsePipes } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto, VerifyCredentialsDto } from './dto/user.dto';
import { TenantGuard } from '../tenant/tenant.guard';
import { Audit } from '../audit-log/audit.decorator';

@Controller('users')
@UseGuards(TenantGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @Audit({ action: 'user.register', resourceType: 'user' })
  async register(@Body() dto: RegisterUserDto) {
    const user = await this.userService.registerUser(dto.email, dto.password, dto.username, dto.metadata);
    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        status: user.status,
        migrationStatus: user.migrationStatus,
        createdAt: user.createdAt,
      },
    };
  }

  @Post('verify-password')
  async verifyPassword(@Body() dto: VerifyCredentialsDto) {
    const result = await this.userService.verifyCredentials(dto.identifier, dto.password);
    return {
      message: 'Credentials verified successfully',
      ...result,
    };
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.userService.getUserById(id);
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        status: user.status,
        migrationStatus: user.migrationStatus,
        createdAt: user.createdAt,
      },
    };
  }
}
