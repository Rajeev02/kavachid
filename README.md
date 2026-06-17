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

## 🗺️ Remaining Project Phases

Based on the core vision of KavachID, the remaining implementation milestones are:

* **Phase 5: Admin Console (UI)**: A React-based web control plane for managing tenants, viewing security audit logs, monitoring session metrics, managing users, and rotating signing keys manually.
* **Phase 6: Unified SDK Platform**: Client libraries for frontend and backend integration.
* **Phase 7: Infrastructure & Kubernetes Operator**: Docker Compose configs, Helm Charts, and a Kubernetes Operator for zero-downtime, self-hosted deployment.
* **Phase 8: OIDC Conformance & Compliance**: Validating compliance against the FAPI 2.0 security standards and executing automated cryptographic stress-testing.
* **Phase 9: Documentation & Community Portal**: Comprehensive developer documentation, RFC processes, and ADR guidelines.

---

## 📦 Publishing Client SDK Libraries

Yes! The core authentication and authorization services of KavachID can be easily consumed by publishing client-side SDK libraries. Since KavachID is API-first, standard client SDKs can be distributed across package registries:

* **Node.js/React/Next.js/React Native**: Published via **npm** under `@kavachid/react`, `@kavachid/react-native`, or `@kavachid/node`.
* **Flutter**: Published via **pub.dev** as `kavachid_flutter`.
* **Android (Native)**: Published via **Maven Central** as `kavachid-android`.
* **iOS (Native)**: Distributed via **CocoaPods** or **Swift Package Manager (SPM)** as `kavachid-ios`.

### How Client SDKs Function Internally:
1. **PKCE & Authorization Code Flow**: The SDKs automate the generation of cryptographically secure `code_verifier` and `code_challenge` parameters (RFC 7636) to prevent authorization code interception.
2. **Client-Side DPoP Signing**: 
   * **Web/React/Next.js**: Uses the Web Crypto API to generate ephemeral keys and sign DPoP headers.
   * **React Native**: Uses `react-native-keychain` and secure enclave interfaces to sign headers.
   * **Flutter/iOS/Android**: Uses native keychains (Android Keystore / iOS Keychain) to bind the token cryptographically to device hardware.
3. **Session State & Refresh Handlers**: Automatically listens for token expiration and triggers background refresh calls (RTR) to fetch updated access tokens without interrupting the user.
4. **Backend SDK Verification**: Backend SDKs (like `@kavachid/node` or Go/Python SDKs) pull public keys from the server's `/oauth/jwks` endpoint and verify incoming access tokens locally (sub-millisecond speed) without requiring database lookups or API calls to the KavachID server.

---

## 📄 License

KavachID is distributed under the **Apache 2.0** License. It is 100% open-source with no feature-locking or hidden commercial dependencies.
