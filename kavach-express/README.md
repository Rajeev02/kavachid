# @kavachid/express <img src="https://raw.githubusercontent.com/Rajeev02/kavachid/main/assets/logo-icon-only.png" width="24" height="24" alt="KavachID Shield" style="vertical-align: middle;" />

**Express Authentication Middleware** for KavachID - next-generation, DPoP-bound, multi-tenant Identity & Access Management.

`@kavachid/express` provides an out-of-the-box authentication middleware to secure your Express backend routes. It validates KavachID-issued Bearer JWTs locally using remote JSON Web Key Sets (JWKS), enforces multi-tenant header isolation consistency, and verifies cryptographic DPoP (RFC 9449) proof headers.

---

## 🚀 Why Use KavachID Express?

* **Local Signature Verification (JWKS):** Validates incoming JWT signatures locally using cached key sets retrieved from the public KavachID JWKS endpoints, avoiding network request delays on every call.
* **Strict DPoP Validation:** Automatically enforces cryptographic DPoP signatures if the token contains key binding claims (`cnf.jkt`). Mismatches in request URL, HTTP Method, or key thumbprints result in instant 401 denials.
* **Tenant Isolation Enforcement:** Ensures that requests belong to the correct tenant context and verifies consistency between token claims and incoming `x-tenant-id` request headers.

---

## 📦 Installation
Requires `jose` and `express` (peer dependencies):
```bash
npm install @kavachid/express
```

---

## 🏃 Quick Start

### 1. Protect Express Routes
Import `kavachAuth` and mount it as a middleware on target routers:

```typescript
import express from 'express';
import { kavachAuth, AuthenticatedRequest } from '@kavachid/express';

const app = express();

// Configure the authentication middleware
const auth = kavachAuth({
  serverUrl: 'https://api.kavachid.local',
  requiredTenantId: 'your-tenant-uuid-here', // Optional: Lock entire app to one tenant
});

// Apply as route middleware
app.get('/api/v1/sensitive-data', auth, (req: AuthenticatedRequest, res) => {
  // If the request reaches here:
  // - JWT signature is verified against public JWKS keys.
  // - Tenant constraints are validated.
  // - Cryptographic DPoP binding has been confirmed (if token was bound).
  
  const user = req.user; // Contains sub, tenantId, email, and username claims
  res.json({
    status: 'success',
    data: 'Protected details for user ' + user?.sub
  });
});

app.listen(3001, () => {
  console.log('App listening on port 3001');
});
```

---

## 🛠️ Supported Platforms & Minimum Versions

* **Node.js:** Requires Node.js v18.0.0+ (ESM or CommonJS).
* **Express Framework:** Compatible with Express 4.x and Express 5.x.
* **Typings:** Built-in TypeScript support with extended `AuthenticatedRequest` context interfaces.


## Getting Started

### 1. Setup the Core Infrastructure
Before using this middleware/library, ensure your primary PostgreSQL database and Redis (if using caching/throttling) are running.

### 2. Install and Import
Install the library via npm, yarn, or pnpm. Then import it into your NestJS, Express, or other Node.js application.

### 3. Configure Middleware/Guards
Apply the provided middleware to protect your routes.

```typescript
// Example usage:
import { KavachMiddleware } from '@kavachid/express';

app.use('/protected', KavachMiddleware({
  jwksUri: 'http://localhost:3000/.well-known/jwks.json',
  audience: 'your-api-audience',
  issuer: 'http://localhost:3000'
}));
```
