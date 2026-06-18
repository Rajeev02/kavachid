# Kavach Web SDK (`@rajeev02/kavach-web`)

Enterprise-grade Browser SDK for the Kavach Shield Engine, providing frictionless WebAuthn & FIDO2 integration for modern web applications.

[![NPM Version](https://img.shields.io/npm/v/@rajeev02/kavach-web.svg?style=flat-square)](https://www.npmjs.com/package/@rajeev02/kavach-web)
[![Language](https://img.shields.io/badge/Language-TypeScript-blue.svg?style=flat-square)]()
[![Platform Support](https://img.shields.io/badge/Platform-Browser-lightgrey.svg?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Keywords:** `webauthn`, `fido2`, `passkeys`, `authentication`, `security`, `zero-trust`, `biometrics`, `typescript`, `react`, `vue`

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Compatibility Matrix](#compatibility-matrix)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Advanced Configuration](#advanced-configuration)
- [Troubleshooting](#troubleshooting)
- [License](#license)

*(For global architecture, CI/CD, and security guidelines, see the [Root Repository](../../README.md))*

---

## 🚀 Overview

Implementing WebAuthn cryptography natively in the browser is notoriously difficult and error-prone. The **Kavach Web SDK** abstracts the `navigator.credentials` Web API into a single, elegant TypeScript interface. 

It is designed for frontend engineers building React, Vue, Angular, or Vanilla JS web applications who want to implement passwordless authentication (TouchID, Windows Hello, YubiKeys) without managing the underlying cryptographic challenge-response cycles.

---

## ✨ Features

| Feature | Description |
| ------- | ----------- |
| **WebAuthn/FIDO2 Ready** | Instantly trigger native browser biometric prompts. |
| **Device Fingerprinting** | Generates robust, privacy-preserving client identifiers to detect account takeovers. |
| **Risk-Based Step-Up** | Automatically challenges the user for biometrics only when KSE risk scores spike. |
| **TypeScript Native** | Built with strict TypeScript for maximum IDE autocomplete and type safety. |

---

## 💻 Compatibility Matrix

| Component | Supported Version | Notes |
| :--- | :--- | :--- |
| **Node.js** | 18.x, 20.x, 22.x | Required for SSR environments (e.g., Next.js). |
| **Browsers** | Chrome 67+, Safari 13+, Edge 18+ | Requires Secure Contexts (HTTPS). |
| **Frameworks** | React, Vue, Svelte, Angular | Framework agnostic. |

---

## 📦 Installation

Install the package via your preferred node package manager:

```bash
# NPM
npm install @rajeev02/kavach-web

# Yarn
yarn add @rajeev02/kavach-web

# PNPM
pnpm add @rajeev02/kavach-web
```

---

## ⚡ Quick Start

### 1. Initialization
Instantiate the `KavachClient` with your backend server URL.

```typescript
import { KavachClient } from '@rajeev02/kavach-web';

const kavach = new KavachClient({ 
  serverUrl: 'https://api.yourdomain.com/kavach',
  timeout: 5000 
});
```

### 2. Passwordless Login
Trigger the native browser biometric prompt (e.g., Apple TouchID or Windows Hello).

```typescript
async function handleLogin() {
  try {
    const session = await kavach.loginWithBiometrics('user@example.com');
    console.log("Securely authenticated! JWT Token:", session.token);
    
    // Proceed to redirect user to dashboard
  } catch (err) {
    console.error("Biometric authentication failed or was canceled.", err);
  }
}
```

---

## 🛠️ Advanced Configuration

### Step-Up Authentication (MFA)
For high-risk actions (like transferring funds), you can manually verify user presence without a full login cycle:

```typescript
async function transferFunds(amount: number) {
  // Verifies presence via WebAuthn silently
  const isVerified = await kavach.verifyPresence();
  
  if (isVerified) {
    await api.post('/transfer', { amount });
  } else {
    alert("Security verification failed. Transfer blocked.");
  }
}
```

---

## 🐛 Troubleshooting

*   **Error: `NotAllowedError` or WebAuthn Not Supported:** 
    Ensure your site is served over **HTTPS**. WebAuthn APIs (`navigator.credentials`) are strictly restricted to secure contexts by modern browsers. `http://localhost` is the only exception.
*   **Cross-Origin Errors (CORS):** 
    Ensure your backend Kavach server has the correct CORS headers configured to accept requests from your frontend domain.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
