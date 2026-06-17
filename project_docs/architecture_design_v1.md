# KavachID V1 Architecture & Implementation Design

This document details the architectural baseline, file structure, database schema, module definitions, and verification patterns established for **KavachID V1**.

---

## 1. Project Directory Layout

The application backend uses a structured, modular TypeScript architecture built with **NestJS 11**:

```text
/Users/rajeevjoshi/Documents/Auth/
├── package.json                    # Project metadata & dependency list
├── tsconfig.json                   # TypeScript config
├── nest-cli.json                   # NestJS builder config
├── prisma/
│   ├── schema.prisma               # Multi-tenant Prisma schema models
│   └── migrations/                 # Local database migration scripts
└── src/
    ├── main.ts                     # Application entry point
    ├── app.module.ts               # Core app bootstrap module
    └── modules/
        ├── database/               # PostgreSQL pooling (PrismaService wrapper)
        │   ├── prisma.service.ts
        │   └── database.module.ts
        ├── tenant/                 # AsyncLocalStorage context propagation
        │   ├── tenant.context.ts
        │   ├── tenant.middleware.ts
        │   ├── tenant.guard.ts
        │   └── tenant.module.ts
        ├── crypto/                 # Centralized cryptography core
        │   ├── crypto.service.ts
        │   ├── crypto.service.spec.ts  # Validation test suites
        │   └── crypto.module.ts
        └── outbox/                 # Outbox table publisher and poller
            ├── outbox.service.ts
            └── outbox.module.ts
```

---

## 2. Multi-Tenant Database Schema

To support massive scalability and potential future database sharding/partitioning, **all tenant-specific tables contain a `tenant_id`**. Composite indexes and foreign key references ensure strict row-level isolation.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Tenant {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name       String
  status     String   @default("active")
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt  DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  users         User[]
  devices       Device[]
  sessions      Session[]
  organizations Organization[]
  roles         Role[]
  permissions   Permission[]
  outboxEvents  OutboxEvent[]
  auditLogs     AuditLog[]
  orgMembers    OrganizationMember[]
  rolePerms     RolePermission[]
  userRoles     UserRole[]

  @@map("tenants")
}

model User {
  id              String   @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId        String   @map("tenant_id") @db.Uuid
  email           String?
  username        String?
  passwordHash    String?  @map("password_hash")
  status          String   @default("pending_verification")
  migrationStatus String   @default("active") @map("migration_status") // 'migrated', 'legacy'
  metadata        Json?
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  devices         Device[]
  sessions        Session[]
  orgMembers      OrganizationMember[]
  roles           UserRole[]

  @@id([tenantId, id])
  @@unique([tenantId, email])
  @@unique([tenantId, username])
  @@map("users")
}

model Device {
  id             String   @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId       String   @map("tenant_id") @db.Uuid
  userId         String   @map("user_id") @db.Uuid
  platform       String
  deviceName     String?  @map("device_name")
  fingerprint    String
  dpopPublicKey  String?  @map("dpop_public_key")
  isTrusted      Boolean  @default(false) @map("is_trusted")
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  lastSeenAt     DateTime @default(now()) @map("last_seen_at") @db.Timestamptz(6)

  tenant         Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user           User     @relation(fields: [tenantId, userId], references: [tenantId, id], onDelete: Cascade)
  sessions       Session[]

  @@id([tenantId, id])
  @@map("devices")
}

model Session {
  id                String    @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId          String    @map("tenant_id") @db.Uuid
  userId            String    @map("user_id") @db.Uuid
  deviceId          String?   @map("device_id") @db.Uuid
  refreshVerHash    String    @map("refresh_token_hash")
  ipAddress         String    @map("ip_address")
  userAgent         String?   @map("user_agent")
  lastSeenAt        DateTime  @default(now()) @map("last_seen_at") @db.Timestamptz(6)
  riskScore         Decimal   @default(0.00) @map("risk_score") @db.Decimal(5, 2)
  createdAt         DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  revokedAt         DateTime? @map("revoked_at") @db.Timestamptz(6)

  tenant            Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user              User      @relation(fields: [tenantId, userId], references: [tenantId, id], onDelete: Cascade)
  device            Device?   @relation(fields: [tenantId, deviceId], references: [tenantId, id], onDelete: SetNull)

  @@id([tenantId, id])
  @@map("sessions")
}

model Organization {
  id           String   @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId     String   @map("tenant_id") @db.Uuid
  name         String
  customDomain String?  @unique @map("custom_domain")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  tenant       Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  members      OrganizationMember[]

  @@id([tenantId, id])
  @@map("organizations")
}

model OrganizationMember {
  organizationId String   @map("organization_id") @db.Uuid
  tenantId       String   @map("tenant_id") @db.Uuid
  userId         String   @map("user_id") @db.Uuid
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  tenant         Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  organization   Organization @relation(fields: [tenantId, organizationId], references: [tenantId, id], onDelete: Cascade)
  user           User     @relation(fields: [tenantId, userId], references: [tenantId, id], onDelete: Cascade)

  @@id([tenantId, organizationId, userId])
  @@map("organization_members")
}

model Role {
  id          String   @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  name        String
  description String?
  isSystem    Boolean  @default(false) @map("is_system")

  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  permissions RolePermission[]
  users       UserRole[]

  @@id([tenantId, id])
  @@unique([tenantId, name])
  @@map("roles")
}

model Permission {
  id        String   @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  resource  String
  action    String

  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  roles     RolePermission[]

  @@id([tenantId, id])
  @@unique([tenantId, resource, action])
  @@map("permissions")
}

model RolePermission {
  tenantId     String @map("tenant_id") @db.Uuid
  roleId       String @map("role_id") @db.Uuid
  permissionId String @map("permission_id") @db.Uuid

  tenant       Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  role         Role   @relation(fields: [tenantId, roleId], references: [tenantId, id], onDelete: Cascade)
  permission   Permission @relation(fields: [tenantId, permissionId], references: [tenantId, id], onDelete: Cascade)

  @@id([tenantId, roleId, permissionId])
  @@map("role_permissions")
}

model UserRole {
  tenantId String @map("tenant_id") @db.Uuid
  userId   String @map("user_id") @db.Uuid
  roleId   String @map("role_id") @db.Uuid

  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user     User   @relation(fields: [tenantId, userId], references: [tenantId, id], onDelete: Cascade)
  role     Role   @relation(fields: [tenantId, roleId], references: [tenantId, id], onDelete: Cascade)

  @@id([tenantId, userId, roleId])
  @@map("user_roles")
}

model KeyPair {
  id                  String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  kid                 String   @unique
  publicKeyPem        String   @map("public_key_pem")
  encryptedPrivateKey String   @map("encrypted_private_key")
  algorithm           String   @default("RS256")
  status              String   @default("active")
  activeFrom          DateTime @map("active_from") @db.Timestamptz(6)
  activeTo            DateTime @map("active_to") @db.Timestamptz(6)
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  @@map("key_pairs")
}

model OutboxEvent {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId    String    @map("tenant_id") @db.Uuid
  eventType   String    @map("event_type")
  payload     Json
  status      String    @default("pending")
  retryCount  Int       @default(0) @map("retry_count")
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  processedAt DateTime? @map("processed_at") @db.Timestamptz(6)

  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("outbox_events")
}

model AuditLog {
  id           String   @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId     String   @map("tenant_id") @db.Uuid
  actorId      String?  @map("actor_id") @db.Uuid
  action       String
  resourceType String   @map("resource_type")
  resourceId   String?  @map("resource_id")
  metadata     Json?
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  tenant       Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@id([tenantId, id])
  @@map("audit_logs")
}
```

---

## 3. Core Module Specifications

### Tenant Module
* **Context Manager (`tenant.context.ts`)**: Uses Node.js's `AsyncLocalStorage` to store the tenant identifier safely across asynchronous operations.
* **Middleware (`tenant.middleware.ts`)**: Binds target requests. Extracts tenant ID via `x-tenant-id` header or matches path regex expressions (`/t/:tenantId` or `/tenants/:tenantId`).
* **Route Guard (`tenant.guard.ts`)**: Enforces presence validation for secure endpoints.

### Cryptography Core (`crypto.service.ts`)
* **Argon2id Thread Pool**: Executes CPU-heavy credential hashing tasks using Node.js `Worker` threads (loaded inline using standard `eval: true` execution). This safeguards the main NestJS event loop.
* **asymmetric key pairs**: Supports RS256/ES256 key pair generations.
* **JWT & JWKS Mapping**: Translates keys to standard public JWK formats.
* **DPoP (RFC 9449) Proofs**: Verifies DPoP signatures, maps client keys, and computes public key thumbprints (`jkt`) to bind sessions.

### Outbox Engine (`outbox.service.ts`)
* **Simulated Poller**: Standardized 5-second polling loop that scans, dispatches, and updates `outbox_events` logs asynchronously.

---

## 4. Verification Benchmarks

Verification is fully automated via local Jest unit and integration tests.

### Hashing Event Loop Lag Test
In `crypto.service.spec.ts`, the lag test monitors NestJS main thread latency during 5 simultaneous CPU-intensive Argon2id hashing requests:
* **Metric Checked**: Delay in `setInterval` execution.
* **Result**: Main thread lag remains below **50ms** (often < 10ms), validating that heavy cryptographic actions are successfully offloaded.

### DPoP Binding Test
Validates client-side DPoP signed headers:
* Asserts signature checks pass for correct HTTP methods/URLs.
* Verifies that tampering with header methods or destination URLs results in immediate verification failures.
