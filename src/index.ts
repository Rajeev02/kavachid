// Modules
export { KavachCoreModule } from './modules/kavach-core.module';
export type { KavachCoreModuleOptions } from './modules/kavach-core.options';

// Services
export { UserService } from './modules/user/user.service';
export { SessionService } from './modules/session/session.service';
export { KeyPairService } from './modules/keypair/keypair.service';
export { RoleService } from './modules/role/role.service';
export { AuditLogService } from './modules/audit-log/audit-log.service';
export { OutboxService } from './modules/outbox/outbox.service';
export { CryptoService } from './modules/crypto/crypto.service';

// Guards & Interceptors
export { AuthGuard } from './modules/auth/auth.guard';
export { PermissionsGuard } from './modules/auth/permissions.guard';
export { TenantGuard } from './modules/tenant/tenant.guard';
export { AuditLogInterceptor } from './modules/audit-log/audit-log.interceptor';

// Decorators
export { RequirePermissions } from './modules/auth/permissions.decorator';
export { Audit } from './modules/audit-log/audit.decorator';
