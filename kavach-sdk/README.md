<div align="center">
  <h1>🛡️ @rajeev02/kavach-sdk</h1>
  <p><b>The Universal Auth & Risk Engine SDK</b></p>
  <p>Seamlessly integrate Passkeys, Role-Based Access, Device Fingerprinting, and the Kavach Shield Engine into your Web, Mobile, and Backend applications.</p>
</div>

---

## 📖 Overview

`@rajeev02/kavach-sdk` is the official client library for the **Kavach Ecosystem**. It abstracts away the complex cryptography of DPoP, PKCE, and WebAuthn, giving you a beautiful, simple API to authenticate users and dynamically enforce security policies based on device trust.

### ☁️ Deployment Models
**Do I need to deploy my own Kavach server to use this SDK?**
No! 
*   **Kavach Cloud Hosted:** You can simply point the `serverUrl` in the SDK to your Kavach Cloud SaaS tenant.
*   **Self-Hosted:** You can point the SDK to your own self-hosted Kavach ID server.
*   **Local Execution:** The SDK handles Device Fingerprinting, Passkey generation, and Biometric Step-Ups (FaceID/TouchID) entirely locally on the user's Mobile or Web device. The backend is only contacted to cryptographically verify these actions.

---

## 🚀 Installation

```bash
npm install @rajeev02/kavach-sdk
# or
yarn add @rajeev02/kavach-sdk
# or
pnpm add @rajeev02/kavach-sdk
```

---

## 💻 1. Core Authentication API (Frontend/Mobile)

Initialize the client in your React, React Native, iOS, Android, or Vanilla JS app.

```typescript
import { KavachClient } from '@rajeev02/kavach-sdk';

const kavach = new KavachClient({
  serverUrl: 'https://api.yourkavachcloud.com',
  tenantId: 'your-tenant-id',
  clientId: 'your-app-client-id' // Optional
});
```

### 🔐 Standard Email/Password Login
The SDK automatically handles DPoP key generation, PKCE challenges, and secure token storage (LocalStorage for Web, Memory/Encrypted for Native).

```typescript
// Register a user
await kavach.register('user@example.com', 'securePassword123!', 'johndoe');

// Login
const session = await kavach.login('user@example.com', 'securePassword123!');
console.log('Access Token:', session.accessToken);
```

### 👆 Passkeys & WebAuthn (Passwordless)
Kavach natively supports FIDO2 Passkeys (FaceID, TouchID, Windows Hello). The SDK automatically triggers the native device biometric prompts.

```typescript
// Prompt the user to register their device's biometric scanner as a Passkey
await kavach.registerPasskey();

// Later, log them in instantly with just a biometric scan!
const session = await kavach.loginWithPasskey('user@example.com');
```

### 🔄 Session Management
Tokens are automatically securely rotated.

```typescript
// Get current user profile
const profile = await kavach.getProfile();

// Get active sessions across all devices
const sessions = await kavach.getSessions();

// Logout of current device
await kavach.logout();

// Revoke all active sessions on all devices (if phone is stolen)
await kavach.logoutAll();
```

---

## 🛡️ 2. The Kavach Shield Engine (KSE)
The Kavach Shield Engine (KSE) is our flagship enterprise risk engine. It scores every API request based on Device Trust, Network IP (VPN/TOR detection), and User Behavior.

### Securing Your Backend (Node.js/Express)
You can protect your own backend routes using the SDK's built-in Express middleware. If KSE detects a VPN or a high-risk action, the middleware automatically returns a `401 STEP_UP_REQUIRED`.

```typescript
import express from 'express';
import { kseEnforce } from '@rajeev02/kavach-sdk';

const app = express();

app.post('/wallet/transfer', kseEnforce({
  kseBaseUrl: 'https://api.yourkavachcloud.com', 
  level: 3, // Level 3 = High Security Action (Requires strong device trust)
  actionType: 'wallet_transfer',
  productName: 'My Wallet App',
  getTenantId: (req) => req.headers['x-tenant-id'],
  getUserId: (req) => req.user.id,
  getSessionId: (req) => req.session.id
}), (req, res) => {
  // KSE verified the device, network, and policy. Action is ALLOWED.
  res.json({ success: true, message: 'Transfer Complete' });
});
```

### Handling Step-Ups on the Frontend
If your backend's `kseEnforce` middleware returns a `STEP_UP_REQUIRED` (e.g., because the user is transferring $5,000 from a new country), you catch it on the frontend and trigger a Passkey challenge.

```typescript
import { generateDeviceFingerprint } from '@rajeev02/kavach-sdk';

async function transferMoney() {
  const fingerprint = await generateDeviceFingerprint(); 

  const response = await fetch('https://my-backend.com/wallet/transfer', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await kavach.getAccessToken()}`,
      'x-device-fingerprint': fingerprint
    },
    body: JSON.stringify({ amount: 5000 })
  });

  if (response.status === 401) {
    const data = await response.json();
    if (data.decision === 'STEP_UP_REQUIRED') {
      // Security Policy triggered! Prompt user for FaceID/TouchID to verify identity
      await kavach.loginWithPasskey('user@example.com', fingerprint);
      // Re-run the transfer function now that trust is elevated!
      return transferMoney();
    }
  }
}
```

---

## 🌍 Supported Platforms
The `@rajeev02/kavach-sdk` is written in universal TypeScript and compiles down to targets that natively support:
*   **Web:** React, Vue, Svelte, Vanilla JS.
*   **Mobile:** React Native (Expo/Bare), Flutter (via JS interop or native bridges), Native iOS (Swift), Native Android (Kotlin).
*   **Backend:** Node.js, Express, Fastify, NestJS.

*Note: For Python and Go backends, you can interact with the Kavach API directly via standard HTTP requests.*

---

## 🤝 Contributing & Support
Please refer to the root Kavach Ecosystem repository for contribution guidelines, architecture diagrams, and the Admin Console configuration guide.
