# KavachID 🛡️

**KavachID** is a next-generation, 100% open-source Identity & Access Management (IAM) operating system and trust infrastructure. Built with NestJS, Prisma 7, and PostgreSQL, it is designed from the ground up to provide state-of-the-art security, multi-tenant isolation, Zero Trust device binding, and high-performance token authorization.

---

## 🚀 Key Features Implemented (Phases 1-6)

### 1. Multi-Tenant Isolated User Management
* **Tenant Isolation**: Secure context isolation using custom headers (`x-tenant-id`) and isolated schemas.
* **Modern Cryptography**: Argon2id password hashing executed asynchronously via a worker-thread pool protecting the main Node.js event loop.
* **Just-in-Time (JIT) Legacy Migration**: Lazy migration workflows allowing seamless legacy system upgrades via secure webhook-based verification.

### 2. High-Security Token Session Lifecycle
* **DPoP (RFC 9449)**: Demonstating Proof-of-Possession binding at the protocol level. Access tokens are bound to client-specific cryptographic key thumbprints (`cnf.jkt`) to prevent token theft and replay attacks.
* **Refresh Token Rotation (RTR)**: Cryptographically rotates refresh tokens on every usage, invalidating the previous version.
* **Hijack/Replay Detection**: Instant detection of refresh token reuse trigger invalidation of all active sessions for the compromised user.
* **Active Session Management**: Discover active sessions and revoke tokens on-demand.

### 3. Key Rotation & Public JWKS
* **Private Key Security**: RSA private keys are encrypted at rest using symmetric AES-256-GCM.
* **Automatic Key Rotation**: Key rotation cycle generating new keys and updating status flags dynamically.
* **JWKS Endpoints**: Exposes OpenID-compliant JSON Web Key Sets (`/oauth/jwks` and `/.well-known/jwks.json`) for public verification.

### 4. Tenant-Isolated Authorization Engine (RBAC)
* **Dynamic Access Control**: Manage hierarchical Roles, Permissions, Role-Permission mappings, and User-Role assignments.
* **Global Security Guards**: Global NestJS authentication (`AuthGuard`) and permission guards (`PermissionsGuard`) secure endpoints using decorator metadata.

### 5. Observability, Security Audit Logs & Webhooks
* **Automated Audit Logs**: A global `AuditLogInterceptor` intercepts requests to annotated route handlers, automatically recording actions, actors, and resource IDs inside database audit tables.
* **Metadata Sanitization**: Automatically removes sensitive information (passwords, tokens, secrets) before persisting audit metadata.
* **Transactional Outbox & Webhooks**: Uses the Transactional Outbox Pattern to publish event webhooks to external listeners (`process.env.WEBHOOK_URL`) via Axios.
* **Exponential Backoff Retries**: Failed webhook notifications automatically retry with exponential backoff ($2^{\text{retryCount}}$ seconds) up to 5 times.

---

## 🛠️ Tech Stack & Dependencies

* **Core Framework**: NestJS 11
* **Database Interface**: Prisma 7 + PostgreSQL 16
* **Database Driver Adapter**: `@prisma/adapter-pg` + `pg` (required for Prisma 7 compatibility)
* **Password Hashing**: `argon2` (using multi-threaded worker pools)
* **JWT / Cryptography**: `jose` (ESM native, fully transformed for Jest)
* **HTTP Client**: `axios`

---

## 📂 Project Architecture

```text
src/
├── app.controller.ts
├── app.module.ts
├── main.ts
└── modules/
    ├── audit-log/       # Audit Decorator, Service, & Interceptor
    ├── auth/            # Auth Guard, Permissions Decorator, & Permissions Guard
    ├── crypto/          # Argon2 worker threads, AES-256-GCM, & JWT utils
    ├── database/        # Prisma Client & PostgreSQL driver adapter
    ├── keypair/         # RSA Key generation, rotation, & JWKS endpoints
    ├── outbox/          # Webhook dispatcher & retry poller
    ├── role/            # Roles & Permissions administration controllers/services
    ├── session/         # Login, DPoP binding, RTR, reuse check, & logout
    ├── tenant/          # Multi-tenant context and guards
    └── user/            # Registration & credentials verification
```

### 📖 API Reference

Detailed HTTP API specifications, including payload models, request/response headers, and status codes for all modules, are documented in the [API Specification](project_docs/api_documentation.md).

---

## 🏃 Getting Started

### 1. Project Setup
```bash
# Clone the repository
git clone https://github.com/Rajeev02/kavachid.git
cd kavachid

# Install dependencies
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/kavachid?schema=public"
KAVACHID_MASTER_KEY="your-32-byte-hex-encoded-master-encryption-key"
WEBHOOK_URL="http://localhost:3000/webhook"
```

### 3. Run Schema Migrations
Deploy the multi-tenant Prisma schema to your local PostgreSQL instance:
```bash
npx prisma db push
```

### 4. Start the Application
```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

### 5. Running Tests
```bash
# Unit & integration tests
npm run test

# End-to-End integration tests
npm run test:e2e
```

---

## 📦 Reusable Backend Library (`KavachCoreModule`)

KavachID can be imported directly into other NestJS backends as a reusable authentication and authorization dynamic module. This allows you to manage user accounts, sessions, key rotation, and RBAC policies while maintaining complete control over your database.

### 1. Import the Core Module
In your main NestJS application module (e.g., `app.module.ts`), import the module dynamically:

```typescript
import { Module } from '@nestjs/common';
import { KavachCoreModule } from 'kavachid';

@Module({
  imports: [
    KavachCoreModule.forRoot({
      databaseUrl: 'postgresql://username:password@localhost:5432/kavachid?schema=public',
      masterKey: 'your-32-byte-hex-encoded-master-encryption-key',
      webhookUrl: 'https://your-api.domain.com/webhooks',
      accessTokenExpiresIn: '15m',
      refreshTokenExpiresIn: '7d',
    }),
  ],
})
export class AppModule {}
```

*Note: If no options are passed, the module defaults to standalone hosting mode, automatically reading configurations from your `.env` variables.*

### 2. Protect Endpoints Using Guards and Decorators
The backend module exports pre-built NestJS guards and custom decorators for seamless access control:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard, PermissionsGuard, RequirePermissions, Audit } from 'kavachid';

@Controller('billing')
@UseGuards(AuthGuard, PermissionsGuard) // Require valid JWT and tenant isolation context
export class BillingController {
  
  @Get('invoices')
  @RequirePermissions('billing:read') // Enforce Role-Based Access Control
  @Audit('READ_INVOICES') // Automatically capture audit trail in the outbox
  async getInvoices() {
    return { invoices: [] };
  }
}
```

---

## 📱 Unified JS/TS Client SDK (`@kavachid/sdk`)

The `@kavachid/sdk` is a lightweight, cross-platform TypeScript SDK compatible with Web, React, Next.js, React Native, and Node.js environments. It handles OAuth operations, PKCE challenges, DPoP cryptographic proof signing, and silent token refresh rotation.

### 1. Installation
Install the SDK directly from your project:
```bash
npm install ./kavach-sdk
```

### 2. Basic Initialization
Initialize the `KavachClient` with your KavachID endpoint and tenant ID:

```typescript
import { KavachClient } from '@kavachid/sdk';

const client = new KavachClient({
  serverUrl: 'http://localhost:3000',
  tenantId: '123e4567-e89b-12d3-a456-426614174000', // Multi-tenant context ID
});
```

### 3. Register & Login
```typescript
// Register a new user account
await client.register('user@domain.com', 'SecurePassword123!', 'johndoe', { customMetadata: 'value' });

// Log in user, generating device-bound DPoP key pairs automatically
const authData = await client.login('user@domain.com', 'SecurePassword123!');
console.log('Access Token:', authData.accessToken);
```

### 4. Authenticated API Requests with Silent Token Rotation
Use `authenticatedFetch` as a drop-in replacement for standard `fetch`. It automatically signs requests with ephemeral DPoP headers and handles silent token refresh retries on 401 responses:

```typescript
const response = await client.authenticatedFetch('/auth/sessions');
const activeSessions = await response.json();
```

### 5. Custom Storage Provider (React Native & Mobile Support)
By default, the SDK uses `localStorage` in the browser and fallback in-memory storage elsewhere. You can pass a custom storage adapter (e.g., using `react-native-keychain` or custom SQLite store) by implementing the `StorageProvider` interface:

```typescript
import { KavachClient, StorageProvider } from '@kavachid/sdk';

const customSecureStorage: StorageProvider = {
  async getItem(key: string) {
    return secureStorage.read(key);
  },
  async setItem(key: string, value: string) {
    await secureStorage.write(key, value);
  },
  async removeItem(key: string) {
    await secureStorage.delete(key);
  }
};

const client = new KavachClient({
  serverUrl: 'http://localhost:3000',
  tenantId: '123e4567-e89b-12d3-a456-426614174000',
  storage: customSecureStorage,
});
```

---

## 🔐 SSO Account Chooser (Cross-Domain Single Sign-On)

KavachID comes with native Single Sign-On (SSO) support that perfectly mimics modern Identity Providers (like Google Workspace). 

By default, the SDK supports an `ssoMode` parameter:
* `ssoMode: 'silent'` (Default): Automatically silently logs users into any KavachID application if they have an active session.
* `ssoMode: 'prompt'`: Intercepts the login flow when navigating to a *new* application, displaying an interactive **"Continue as [Username]?"** Account Chooser. This lets users grant explicit consent to specific applications or easily switch accounts without losing their underlying session!

```typescript
const client = new KavachClient({
  serverUrl: 'http://localhost:3000',
  tenantId: '123e4567-e89b-12d3-a456-426614174000',
  ssoMode: 'prompt' // Enables the Account Chooser UI flow
});
```

---

## 🗄️ Data Storage Architecture

KavachID strictly segregates your sensitive data to guarantee Zero Trust security:

### 1. Browser Storage (Frontend)
The SDK utilizes `localStorage` (or secure native storage in mobile) to hold:
* **JWT Tokens**: `kavach_access_token` and `kavach_refresh_token`.
* **DPoP Keys**: `kavach_dpop_key` (A local RSA keypair used to cryptographically sign requests, ensuring token theft is useless).
* **SSO Consent**: `kavach_consented_apps` (Tracks which apps the user has clicked "Continue as..." on).

### 2. PostgreSQL Storage (Backend)
The backend securely manages all persistence via **Prisma 7 ORM**:
* **`User`**: Passwords (hashed via `argon2`), Emails, and Usernames.
* **`Session` & `Device`**: Tracks IP Addresses, User Agents, and Timestamps for Active Sessions (allowing you to implement "Log out of all devices" instantly).
* **`AuditLog`**: Stores the system's security trails (e.g. Failed login attempts, permission grants).

### 🔍 Viewing Your Database (Prisma Studio)
Because KavachID uses Prisma, you get a beautiful visual database browser out of the box!
To view your Postgres data, run:
```bash
npx prisma studio
```
This opens a GUI at `http://localhost:5555` where you can view, edit, or delete records in your `User`, `Session`, and `AuditLog` tables instantly.

---

## 🗺️ Recent Project Phases & Libraries

* **Phase 11: Integration Libraries**: We've published standard wrappers for popular frameworks:
  * `@kavachid/react`: React context and `useKavach` hooks.
  * `@kavachid/react-native`: Secure storage adapters for mobile platforms.
* **Phase 12 & 13: Lightweight Example Suite & Load Testing**: We introduced the **Kavach Store Suite** under `examples/` (`kavach-store`, `kavach-customer`, `kavach-vendor`, `kavach-analytics`, `kavach-admin`), serving as no-build vanilla JS references. We also benchmarked the backend (`autocannon` load-tester), proving high-throughput concurrent DPoP and Argon2 hashing.

---

## 📄 License

KavachID is distributed under the **Apache 2.0** License. It is 100% open-source with no feature-locking or hidden commercial dependencies.
