# ![KavachID](./assets/logo-with-text.png)

**KavachID** is a next-generation, 100% open-source Identity & Access Management (IAM) operating system and trust infrastructure. Built with NestJS, Prisma 7, and PostgreSQL, it is designed from the ground up to provide state-of-the-art security, multi-tenant isolation, Zero Trust device binding (DPoP), and high-performance token authorization.

---

## 🚀 Key Features

* **Multi-Tenant Context Isolation:** Native HTTP header-based tenant isolation (`x-tenant-id`) backed by tenant schema isolation.
* **FIDO2 WebAuthn Passkeys (Phase 19):** Built-in support for biometrics (TouchID, FaceID) and hardware security keys (YubiKeys) using `@simplewebauthn`.
* **Zero Trust Token Security (DPoP - RFC 9449):** Ephemeral client-bound key thumbprints (`cnf.jkt`) prevent token interception, theft, or replay attacks.
* **Strict Refresh Token Rotation (RTR):** Automatically rotates refresh tokens on every request. Instant reuse/hijack detection auto-invalidates all active sessions for the affected user.
* **Intelligent Threat Detection (Phase 20):**
  * **Postgres Rate Limiter:** Custom `PrismaThrottlerStorage` throttles `/auth/login` attempts to prevent brute-force attacks.
  * **Automated Account Lockout:** Cron-based worker scans for failed login patterns and locks accounts (`status = 'LOCKED'`) when failing attempts exceed dynamic `Tenant.maxFailedLogins` thresholds.
* **Social & Enterprise Federation (Phase 21):** Exposes OAuth2 login/callback endpoints for Google and Microsoft with automated JIT user provisioning and link tracking.
* **Cross-Product SSO Consent:** Tracks active session product footprints (`SessionAppAccess`) and presents interactive glassmorphic Account Chooser screens.

---

## 📂 Project Architecture

```text
src/
├── app.controller.ts
├── app.module.ts
├── main.ts
└── modules/
    ├── audit-log/       # Audit Interceptor & decorator metadata
    ├── auth/            # Auth Guards, Roles & Permissions engine
    ├── crypto/          # Argon2 worker threads, AES-256-GCM, & JWT utils
    ├── database/        # Prisma Client & PrismaThrottlerStorage
    ├── federation/      # OAuth2 Social & Enterprise login handlers
    ├── keypair/         # RSA Key generation, rotation, & JWKS endpoints
    ├── outbox/          # Webhook dispatcher & retry poller
    ├── role/            # Roles & Permissions administration controllers/services
    ├── session/         # DPoP binding, RTR, WebAuthn & login sessions
    ├── tenant/          # Multi-tenant context and guards
    ├── threat-detection/# Automated login lockout workers
    └── user/            # Registration & credentials verification
```

---

## 🏃 Sequential Setup Guide

To integrate KavachID into your architecture, follow this step-by-step sequence:

### Step 1: Spin Up the KavachID Core Auth Server (Port 3000)
First, clone the core server repository, configure its database connections, and run it. This acts as your centralized **Authentication Hub** (issuing JWKS public keys, managing users, sessions, passkeys, and tenant contexts).

1. Clone & install dependencies:
   ```bash
   git clone https://github.com/Rajeev02/kavachid.git
   cd kavachid
   npm install
   ```
2. Configure environment variables in `.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/kavachid?schema=public"
   KAVACHID_MASTER_KEY="your-32-byte-hex-encoded-master-encryption-key"
   WEBHOOK_URL="http://localhost:3000/webhook"
   GOOGLE_CLIENT_ID="your-google-client-id"
   MS_CLIENT_ID="your-microsoft-client-id"
   ```
3. Deploy the database schema to your local PostgreSQL instance:
   ```bash
   npx prisma db push
   ```
4. Start the Auth Server:
   ```bash
   npm run start:dev
   ```
   *The core server is now active on `http://localhost:3000`.*

### Step 2: Configure & Start Your Resource Backend (Port 3001)
Next, boot up your custom backend API server (which will process client requests and securely authorize them using KavachID tokens). 
* Use `@kavachid/express` middleware or NestJS `KavachCoreModule` to secure your endpoints.
* Your server will verify Bearer tokens locally against the public JWKS keys exposed by the Core Auth Server on `http://localhost:3000/oauth/jwks`.

1. Go to the demo backend folder:
   ```bash
   cd demo-projects/backend-app
   npm install --legacy-peer-deps
   ```
2. Start the API server:
   ```bash
   npm run start:dev
   ```
   *Your resource backend is now listening on `http://localhost:3001`.*

### Step 3: Run the Frontend Client Applications
Finally, run your client apps (Web, React, React Native, iOS, or Android). They will talk to the Auth Server (Port 3000) to authenticate the user and then attach the DPoP-bound Bearer token to request data from your Resource Backend (Port 3001).

* **React App (Vite):**
  ```bash
  cd demo-projects/web-react-app
  npm install --legacy-peer-deps
  npm run dev
  ```
  *Your React client runs on `http://localhost:8081`.*
* **Vanilla Web App:**
  ```bash
  npx serve demo-projects/web-vanilla-app -l 8082
  ```
  *Your Vanilla Web client runs on `http://localhost:8082`.*

---

## 📦 Backend Integration (`KavachCoreModule`)

`KavachCoreModule` can be integrated directly into any NestJS application to manage tenant contexts, authorization rules, key rotations, and threat detection parameters.

### 1. Register Module dynamically
Register the core module inside your parent module (e.g. `app.module.ts`):

```typescript
import { Module } from '@nestjs/common';
import { KavachCoreModule } from './modules/kavach-core.module';

@Module({
  imports: [
    KavachCoreModule.forRoot({
      databaseUrl: process.env.DATABASE_URL,
      masterKey: process.env.KAVACHID_MASTER_KEY,
      webhookUrl: process.env.WEBHOOK_URL,
      accessTokenExpiresIn: '15m',
      refreshTokenExpiresIn: '7d',
    }),
  ],
})
export class AppModule {}
```

### 2. Guard Routes & Enforce Access Control
Use the custom NestJS guards to enforce multi-tenant isolation, JWT verification, and RBAC permission sets:

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from './modules/auth/auth.guard';
import { PermissionsGuard } from './modules/auth/permissions.guard';
import { TenantGuard } from './modules/tenant/tenant.guard';
import { RequirePermissions } from './modules/auth/permissions.decorator';
import { Audit } from './modules/audit-log/audit.decorator';

@Controller('reports')
@UseGuards(TenantGuard, AuthGuard, PermissionsGuard) // Enforces isolation, valid JWT, and RBAC
export class ReportsController {

  @Get('monthly')
  @RequirePermissions('reports:view')
  @Audit({ action: 'reports.view', resourceType: 'report' })
  async getMonthlyReports() {
    return { data: 'Sales reports...' };
  }
}
```

### 3. Tenant Lockout & Rate Limiting Configuration
The rate-limiting and lockout constraints are configured per-tenant inside the database. Adjust the limits directly on the `Tenant` record:

```typescript
// Update maximum login attempts before account locks out
await prisma.tenant.update({
  where: { id: tenantId },
  data: { maxFailedLogins: 5 } // Account status goes 'LOCKED' on the 5th failed try
});
```

---

## 🌐 Web SDK Integration (`@kavachid/sdk`)

The web client manages browser-native sessionStorage, DPoP keypair generation, and silent refresh rotations automatically.

### 1. Initialize KavachClient
```typescript
import { KavachClient } from '@kavachid/sdk';

const client = new KavachClient({
  serverUrl: 'http://localhost:3000',
  tenantId: 'your-tenant-uuid-here',
  clientId: 'app-client-uuid-here', // Required for cross-product tracking
  ssoMode: 'prompt' // Enables the glassmorphic SSO Account Chooser
});
```

> [!CAUTION]
> **Client-Side vs. Server-Side Security Split**
> The client-side `KavachClient` parameters are strictly public configuration coordinates (API endpoints, Tenant UUIDs, Client IDs). **Never** pass database connection strings, credentials, or backend API secrets directly to client-side code. All database connections and master encryption keys belong exclusively on your secure backend server configuration under `KavachCoreModule.forRoot(...)`.

### 2. Password Credentials Sign-in & Registration
```typescript
// Register account
await client.register('user@example.com', 'SecurePass123!', 'user_name');

// Log in (Automatically generates local DPoP keys and signs the authentication request)
const session = await client.login('user@example.com', 'SecurePass123!');
console.log('User Access Token:', session.accessToken);
```

### 3. Passkey (FIDO2 WebAuthn) Authentication
Trigger local biometric prompts (TouchID / FaceID) natively inside the browser:

```typescript
// 1. Register a new Passkey credential (must be logged in)
await client.registerPasskey();

// 2. Log in using Passkeys (completely passwordless)
const session = await client.loginWithPasskey('user@example.com');
console.log('LoggedIn via Biometrics:', session.accessToken);
```

### 4. Authenticated Fetch Requests
Perform authenticated requests using the fetch wrapper. It injects the tenant ID, Authorization header, and constructs the cryptographic DPoP proof signature automatically. It also refreshes the session silently if the access token has expired:

```typescript
const response = await client.authenticatedFetch('/auth/sessions');
const sessions = await response.json();
```

---

## 📱 Mobile SDK Integrations

Mobile SDK integrations wrap the core DPoP cryptographic logic using hardware security modules (Secure Enclave / Android Keystore) to ensure that private keys can never be extracted.

### 1. iOS Native Integration (`kavach-ios`)
The Swift SDK saves rotated tokens to iOS Keychain and signs DPoP requests using cryptographic keys created in the Secure Enclave.

```swift
import Foundation
import KavachCore

// 1. Initialize Client
let client = KavachClient(
    serverUrl: "https://api.kavachid.local",
    tenantId: "your-tenant-uuid"
)

// 2. Perform login with DPoP signing
client.login(email: "user@example.com", password: "Password123!") { result in
    switch result {
    case .success(let tokens):
        print("AccessToken: \(tokens.accessToken)")
    case .failure(let error):
        print("Login failed: \(error.localizedDescription)")
    }
}

// 3. Make authenticated API call (Signs headers using Secure Enclave)
client.authenticatedRequest(path: "/auth/me", method: "GET") { response in
    // Process response
}
```

### 2. Android Native Integration (`kavach-android`)
Android wraps token storage inside `EncryptedSharedPreferences` and uses an `OkHttp` interceptor to sign outgoing HTTP requests with DPoP headers.

```kotlin
import com.kavachid.sdk.KavachClient
import okhttp3.OkHttpClient

// 1. Initialize SDK
val client = KavachClient(
    context = applicationContext,
    serverUrl = "https://api.kavachid.local",
    tenantId = "your-tenant-uuid"
)

// 2. Authenticate
client.login("user@example.com", "Password123!", onSuccess = { session ->
    Log.d("KavachID", "Logged in. Token: ${session.accessToken}")
}, onFailure = { err ->
    Log.e("KavachID", "Auth error", err)
})

// 3. Setup OkHttp client equipped with automatic DPoP signer interceptor
val okHttpClient = OkHttpClient.Builder()
    .addInterceptor(client.getDpopInterceptor())
    .build()
```

### 3. React Native Bridge (`kavach-react-native`)
The React Native module is implemented as a TurboModule (New Architecture), invoking native Swift/Kotlin secure key functions directly via synchronous JavaScript JSI bindings.

```typescript
import NativeKavachModule from 'kavach-react-native';

// Sync DPoP generation via JSI Bridge
const dpopProof = NativeKavachModule.generateDPoPProofSync(
  'POST',
  'https://api.kavachid.local/auth/login'
);

console.log('Generated Mobile cryptographic proof:', dpopProof);
```

### 4. Flutter Integration (`kavach-flutter`)
Dart client integrating with local biometric/secure store packages to manage token lifetimes.

```dart
import 'package:kavach_flutter/kavach_client.dart';

final client = KavachClient(
  serverUrl: 'https://api.kavachid.local',
  tenantId: 'your-tenant-uuid',
);

// Authenticate and save DPoP-bound tokens
await client.login('user@example.com', 'Password123!');
```

---

## 🗄️ Database Inspection (Prisma Studio)

To inspect database audit records, rate limits, login logs, and tenant parameters visually, use the built-in database interface:

```bash
npx prisma studio
```
This runs a GUI accessible at `http://localhost:5555` to browse and manage data models in real-time.

---

## 📄 License

KavachID is distributed under the **Apache 2.0** License. It is 100% open-source with no proprietary feature locks.
