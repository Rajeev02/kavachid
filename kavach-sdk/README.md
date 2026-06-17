# @kavachid/sdk <img src="https://raw.githubusercontent.com/Rajeev02/kavachid/main/assets/logo-icon-only.png" width="24" height="24" alt="KavachID Shield" style="vertical-align: middle;" />

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


## Getting Started

### 1. Setup the Backend First
Before using the frontend SDK, you must have the KavachID core backend running. 
Follow the [KavachID Backend Setup Guide](https://github.com/Rajeev02/kavachid/blob/main/README.md) to start the backend server.

### 2. Configure the SDK
Once your backend is running (e.g., at `http://localhost:3000`), initialize the SDK:

```typescript
import { KavachID } from '@kavachid/sdk'; // or equivalent for your platform

const kavach = new KavachID({
  apiUrl: 'http://localhost:3000',
  tenantId: 'your-tenant-id' // Optional: for multi-tenant setups
});
```

### 3. Implement Authentication
Use the provided hooks, components, or raw SDK methods to authenticate users.
