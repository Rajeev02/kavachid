import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import axios from 'axios';
import { OutboxService } from './../src/modules/outbox/outbox.service';

import { PrismaService } from './../src/modules/database/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const tenantId = '123e4567-e89b-12d3-a456-426614174000'; // Sample UUID

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    // Create the test tenant if it does not already exist
    await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: {
        id: tenantId,
        name: 'E2E Test Tenant',
      },
    });
  });

  afterAll(async () => {
    // Delete the test tenant (which cascades to delete users)
    try {
      await prisma.tenant.delete({
        where: { id: tenantId },
      });
    } catch (err) {}
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('/users (e2e)', () => {
    const tenantId = '123e4567-e89b-12d3-a456-426614174000'; // Sample UUID
    const email = `e2e-${Date.now()}@kavachid.local`;
    const password = 'SuperSecretPassword123!';

    it('POST /users/register - should block requests missing x-tenant-id header', () => {
      return request(app.getHttpServer())
        .post('/users/register')
        .send({ email, password })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('x-tenant-id header or tenant route prefix is required');
        });
    });

    it('POST /users/register - should register a new user under tenant context', () => {
      return request(app.getHttpServer())
        .post('/users/register')
        .set('x-tenant-id', tenantId)
        .send({ email, password })
        .expect(201)
        .expect((res) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toBe(email);
          expect(res.body.user.id).toBeDefined();
        });
    });

    it('POST /users/verify-password - should authenticate the user successfully', () => {
      return request(app.getHttpServer())
        .post('/users/verify-password')
        .set('x-tenant-id', tenantId)
        .send({ identifier: email, password })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.userId).toBeDefined();
        });
    });

    it('POST /users/verify-password - should reject incorrect password', () => {
      return request(app.getHttpServer())
        .post('/users/verify-password')
        .set('x-tenant-id', tenantId)
        .send({ identifier: email, password: 'WrongPassword123!' })
        .expect(401);
    });
  });

  describe('KeyPair & JWKS (e2e)', () => {
    it('GET /.well-known/jwks.json - should serve public key set', () => {
      return request(app.getHttpServer())
        .get('/.well-known/jwks.json')
        .expect(200)
        .expect((res) => {
          expect(res.body.keys).toBeDefined();
          expect(res.body.keys.length).toBeGreaterThanOrEqual(1);
          expect(res.body.keys[0].kty).toBe('RSA');
        });
    });

    it('GET /oauth/jwks - should serve public key set', () => {
      return request(app.getHttpServer())
        .get('/oauth/jwks')
        .expect(200)
        .expect((res) => {
          expect(res.body.keys).toBeDefined();
        });
    });

    it('GET /.well-known/openid-configuration - should serve OpenID Connect provider configuration discovery metadata', () => {
      return request(app.getHttpServer())
        .get('/.well-known/openid-configuration')
        .expect(200)
        .expect((res) => {
          expect(res.body.issuer).toBeDefined();
          expect(res.body.jwks_uri).toBeDefined();
          expect(res.body.token_endpoint).toBeDefined();
          expect(res.body.scopes_supported).toContain('openid');
          expect(res.body.dpop_signing_alg_values_supported).toContain('ES256');
        });
    });
  });

  describe('Auth Session Lifecycle & DPoP (e2e)', () => {
    const email = `session-e2e-${Date.now()}@kavachid.local`;
    const password = 'SuperSecretUserPassword123!';
    let refreshToken = '';
    let accessToken = '';

    beforeAll(async () => {
      // Create user first
      await request(app.getHttpServer())
        .post('/users/register')
        .set('x-tenant-id', tenantId)
        .send({ email, password })
        .expect(201);
    });

    it('POST /auth/login - should authenticate and issue tokens', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .set('x-tenant-id', tenantId)
        .send({ identifier: email, password })
        .expect(201)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
          refreshToken = res.body.refreshToken;
          accessToken = res.body.accessToken;
        });
    });

    it('POST /auth/refresh - should rotate refresh and access tokens', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('x-tenant-id', tenantId)
        .send({ refreshToken })
        .expect(201)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
          expect(res.body.refreshToken).not.toBe(refreshToken);
          refreshToken = res.body.refreshToken; // Save rotated token
        });
    });

    it('GET /auth/sessions - should list active sessions with Bearer token authentication', () => {
      return request(app.getHttpServer())
        .get('/auth/sessions')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.sessions).toBeDefined();
          expect(res.body.sessions.length).toBeGreaterThanOrEqual(1);
        });
    });

    it('POST /auth/logout - should revoke current session', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('x-tenant-id', tenantId)
        .send({ refreshToken })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('RBAC Management (e2e)', () => {
    const email = `rbac-e2e-${Date.now()}@kavachid.local`;
    const password = 'SuperSecretUserPassword123!';
    let accessToken = '';
    let roleId = '';
    let permissionId = '';
    let testUserId = '';

    beforeAll(async () => {
      // 1. Create a user specifically for RBAC tests
      const regRes = await request(app.getHttpServer())
        .post('/users/register')
        .set('x-tenant-id', tenantId)
        .send({ email, password })
        .expect(201);
      testUserId = regRes.body.user.id;

      // 2. Log them in to get an access token
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-tenant-id', tenantId)
        .send({ identifier: email, password })
        .expect(201);
      accessToken = loginRes.body.accessToken;
    });

    it('POST /roles - should create a new role', () => {
      return request(app.getHttpServer())
        .post('/roles')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'E2E Role', description: 'Testing E2E Roles' })
        .expect(201)
        .expect((res) => {
          expect(res.body.role).toBeDefined();
          expect(res.body.role.name).toBe('E2E Role');
          roleId = res.body.role.id;
        });
    });

    it('POST /permissions - should create a new permission', () => {
      return request(app.getHttpServer())
        .post('/permissions')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ resource: 'documents', action: 'delete' })
        .expect(201)
        .expect((res) => {
          expect(res.body.permission).toBeDefined();
          expect(res.body.permission.resource).toBe('documents');
          permissionId = res.body.permission.id;
        });
    });

    it('POST /roles/:roleId/permissions - should assign permission to role', () => {
      return request(app.getHttpServer())
        .post(`/roles/${roleId}/permissions`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ permissionId })
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toContain('Permission assigned to role successfully');
        });
    });

    it('POST /users/:userId/roles - should assign role to user', () => {
      return request(app.getHttpServer())
        .post(`/users/${testUserId}/roles`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ roleId })
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toContain('Role assigned to user successfully');
        });
    });

    it('GET /roles - should list roles under active tenant', () => {
      return request(app.getHttpServer())
        .get('/roles')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.roles).toBeDefined();
          expect(res.body.roles.length).toBeGreaterThanOrEqual(1);
        });
    });

    it('GET /permissions - should list permissions under active tenant', () => {
      return request(app.getHttpServer())
        .get('/permissions')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.permissions).toBeDefined();
          expect(res.body.permissions.length).toBeGreaterThanOrEqual(1);
        });
    });
  });

  describe('Observability: Audit Logging & Webhooks (e2e)', () => {
    let axiosPostSpy: jest.SpyInstance;

    beforeEach(() => {
      axiosPostSpy = jest.spyOn(axios, 'post').mockImplementation(() => Promise.resolve({ status: 200 }));
    });

    afterEach(() => {
      axiosPostSpy.mockRestore();
    });

    it('should create audit log entries in the database for audited actions', async () => {
      const email = `audit-e2e-${Date.now()}@kavachid.local`;
      const password = 'SuperSecretUserPassword123!';

      // Trigger a registration (which is audited as user.register)
      await request(app.getHttpServer())
        .post('/users/register')
        .set('x-tenant-id', tenantId)
        .send({ email, password })
        .expect(201);

      // Wait a moment for async interceptor log writing
      await new Promise((r) => setTimeout(r, 200));

      // Check if audit log was written to database
      const logs = await prisma.auditLog.findMany({
        where: {
          tenantId,
          action: 'user.register',
        },
      });

      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].resourceType).toBe('user');
      expect(logs[0].actorId).toBe(logs[0].resourceId); // Since user.register maps actorId to resourceId
    });

    it('should dispatch outbox events using webhook and retry on failure', async () => {
      // Clear outbox first to have a clean slate for this test
      await prisma.outboxEvent.deleteMany({ where: { tenantId } });

      // Mock axios to fail
      axiosPostSpy.mockImplementation(() => Promise.reject(new Error('Webhook receiver down')));

      const outboxService = app.get<OutboxService>(OutboxService);

      // Create an outbox event
      await outboxService.createEvent(tenantId, 'TestWebhookEvent', { hello: 'world' });

      // Process outbox once (should try and fail)
      await outboxService.processOutbox();

      // Check database to see if retry count was incremented and status is still pending (or failed)
      let events = await prisma.outboxEvent.findMany({
        where: { tenantId, eventType: 'TestWebhookEvent' },
      });

      expect(events.length).toBe(1);
      expect(events[0].status).toBe('pending');
      expect(events[0].retryCount).toBe(1);

      // Mock axios to succeed now
      axiosPostSpy.mockImplementation(() => Promise.resolve({ status: 200 }));

      // Wait at least 2 seconds (backoff for retryCount=1 is 2 seconds: 2^1 = 2s)
      await new Promise((r) => setTimeout(r, 2100));

      // Process outbox again (should succeed)
      await outboxService.processOutbox();

      events = await prisma.outboxEvent.findMany({
        where: { tenantId, eventType: 'TestWebhookEvent' },
      });

      expect(events[0].status).toBe('processed');
      expect(events[0].processedAt).toBeDefined();
    });
  });

  describe('Admin Console APIs (e2e)', () => {
    const adminEmail = `admin-e2e-${Date.now()}@kavachid.local`;
    const regularEmail = `regular-e2e-${Date.now()}@kavachid.local`;
    const password = 'SuperSecretPassword123!';
    let adminToken = '';
    let regularToken = '';
    let adminUserId = '';

    beforeAll(async () => {
      // 1. Register admin user
      const adminReg = await request(app.getHttpServer())
        .post('/users/register')
        .set('x-tenant-id', tenantId)
        .send({ email: adminEmail, password })
        .expect(201);
      adminUserId = adminReg.body.user.id;

      // Log in admin
      const adminLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-tenant-id', tenantId)
        .send({ identifier: adminEmail, password })
        .expect(201);
      adminToken = adminLogin.body.accessToken;

      // 2. Register regular user
      await request(app.getHttpServer())
        .post('/users/register')
        .set('x-tenant-id', tenantId)
        .send({ email: regularEmail, password })
        .expect(201);

      // Log in regular user
      const regularLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-tenant-id', tenantId)
        .send({ identifier: regularEmail, password })
        .expect(201);
      regularToken = regularLogin.body.accessToken;
    });

    it('GET /admin/users - should reject unprivileged user with 403 Forbidden', () => {
      return request(app.getHttpServer())
        .get('/admin/users')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);
    });

    it('GET /admin/users - should allow privileged user after role/permission assignment', async () => {
      // 1. Create admin role
      const roleRes = await request(app.getHttpServer())
        .post('/roles')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin Console Role', description: 'System Administrator' })
        .expect(201);
      const roleId = roleRes.body.role.id;

      // 2. Create permissions
      const permRes1 = await request(app.getHttpServer())
        .post('/permissions')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ resource: 'users', action: 'read' })
        .expect(201);
      const usersReadId = permRes1.body.permission.id;

      const permRes2 = await request(app.getHttpServer())
        .post('/permissions')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ resource: 'sessions', action: 'read' })
        .expect(201);
      const sessionsReadId = permRes2.body.permission.id;

      const permRes3 = await request(app.getHttpServer())
        .post('/permissions')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ resource: 'audit_logs', action: 'read' })
        .expect(201);
      const logsReadId = permRes3.body.permission.id;

      // 3. Link permissions to role
      await request(app.getHttpServer())
        .post(`/roles/${roleId}/permissions`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissionId: usersReadId })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/roles/${roleId}/permissions`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissionId: sessionsReadId })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/roles/${roleId}/permissions`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissionId: logsReadId })
        .expect(201);

      // 4. Assign role to admin user
      await request(app.getHttpServer())
        .post(`/users/${adminUserId}/roles`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roleId })
        .expect(201);

      // 5. Verify admin user can list users
      const usersList = await request(app.getHttpServer())
        .get('/admin/users')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(usersList.body.users).toBeDefined();
      expect(usersList.body.users.length).toBeGreaterThanOrEqual(2);

      // 6. Verify admin user can list sessions
      const sessionsList = await request(app.getHttpServer())
        .get('/admin/sessions')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(sessionsList.body.sessions).toBeDefined();
      expect(sessionsList.body.sessions.length).toBeGreaterThanOrEqual(1);

      // 7. Verify admin user can list audit logs
      const logsList = await request(app.getHttpServer())
        .get('/admin/audit-logs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(logsList.body.logs).toBeDefined();
    });
  });
});
