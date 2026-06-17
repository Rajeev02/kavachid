# @kavachid/sdk 🛡️

**Unified JavaScript/TypeScript Client SDK** for KavachID - next-generation, DPoP-bound, multi-tenant Identity & Access Management.

`@kavachid/sdk` is a lightweight, cross-platform client SDK compatible with Web, React, React Native, and Node.js environments. It handles OAuth operations, PKCE challenges, browser-native FIDO2 WebAuthn Passkeys, local cryptographic key management, and automatic DPoP (RFC 9449) request signing.

---

## 🚀 Why Use KavachID SDK?

* **Cryptographic Token Binding (DPoP):** Automatically generates local ECDSA key pairs to cryptographically sign API requests. Access tokens are bound to these keys, making token theft or replay attacks impossible.
* **Silent Token Rotation:** Injects intercepted `401 Unauthorized` handlers to silently rotate and swap refresh tokens without interrupting user workflows.
* **FIDO2 WebAuthn Passkeys:** Simplifies the biometric authentication handshake. Triggers TouchID/FaceID natively in the browser with simple methods.
* **Multi-Tenant Context Aware:** Automatically handles custom headers like `x-tenant-id` to separate multi-tenant customer bounds.

---

## 📦 Installation
```bash
npm install @kavachid/sdk
```

---

## 🏃 Quick Start

### 1. Initialize Client
```typescript
import { KavachClient } from '@kavachid/sdk';

const client = new KavachClient({
  serverUrl: 'https://api.kavachid.local',
  tenantId: 'your-tenant-uuid-here',
  clientId: 'your-app-client-uuid', // Optional, for cross-product SSO tracking
  ssoMode: 'prompt'                 // 'silent' (default) or 'prompt' (shows account chooser UI)
});
```

### 2. Register & Log In (Password)
```typescript
// Register a new user
await client.register('user@domain.com', 'SecurePassword123!', 'username');

// Log in (Automatically generates local DPoP keys and persists session tokens)
const session = await client.login('user@domain.com', 'SecurePassword123!');
console.log('Access Token:', session.accessToken);
```

### 3. Biometric Passkey Registration & Login (WebAuthn)
Natively invoke local OS biometric prompts (TouchID / FaceID):
```typescript
// 1. Register a new Passkey credential (user must be logged in first)
await client.registerPasskey();

// 2. Log in using Passkeys (completely passwordless)
const session = await client.loginWithPasskey('user@domain.com');
console.log('LoggedIn via Passkey:', session.accessToken);
```

### 4. Authenticated Fetch Wrapper
Perform authenticated requests using the fetch wrapper. It automatically signs requests with DPoP headers and rotates tokens silently on expiration:
```typescript
const response = await client.authenticatedFetch('/auth/sessions');
const activeSessions = await response.json();
```

---

## 🛠️ Supported Platforms & Minimum Versions

* **Supported Environments:** Web Browsers, Node.js (v18+), React Native, and Flutter.
* **Browsers (Web Crypto API):** Chrome 37+, Firefox 34+, Safari 11+, Edge 12+.
* **WebAuthn (Passkeys):** Safari 13+ (iOS/macOS), Chrome 67+, Firefox 60+, Edge 18+. Requires a Secure Context (HTTPS or localhost).
