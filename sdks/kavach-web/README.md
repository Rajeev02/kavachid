# @rajeev02/kavach-web

Browser SDK for the Kavach Shield Engine - WebAuthn & FIDO2 integration.

[![Version](https://img.shields.io/badge/version-1.0.4-blue.svg)](https://www.npmjs.com/package/@rajeev02/kavach-web)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Platform Support](https://img.shields.io/badge/platform-Web-lightgrey.svg)]()

---

## TL;DR

The Kavach Web SDK provides seamless integration with browser-based WebAuthn and FIDO2 standards.

**Who should use it:** Frontend engineers building React, Vue, or Vanilla JS web applications who want to implement passwordless authentication (TouchID, Windows Hello, YubiKeys).

**Quickest way to get started:**
```bash
npm install @rajeev02/kavach-web
```

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Compatibility Matrix](#compatibility-matrix)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [License](#license)

*(For global architecture, CI/CD, and security guidelines, see the [Root README](../../README.md))*

---

## Overview

**Problem Statement:** Complex WebAuthn cryptography is difficult to implement in the browser.
**Technical Value:** Reduces WebAuthn flows into a single, elegant API call.
**Target Users:** Web Developers.

---

## Features

| Feature | Description | Status |
| ------- | ----------- | ------ |
| **WebAuthn/FIDO2 Ready** | Instantly trigger native browser biometric prompts. | Stable |
| **Device Fingerprinting** | Generates robust, privacy-preserving client identifiers. | Stable |
| **Risk-Based Step-Up** | Automatically challenges the user for biometrics. | Stable |

---

## Compatibility Matrix

| Component | Supported Version |
| :--- | :--- |
| **Node.js** | 18.x, 20.x, 22.x (for SSR) |
| **Browsers** | Chrome 67+, Safari 13+, Edge 18+ |

---

## Quick Start

### Install
```bash
npm install @rajeev02/kavach-web
```

### Configure & Run
```typescript
import { KavachClient } from '@rajeev02/kavach-web';

const kavach = new KavachClient({ 
  serverUrl: 'https://api.yourdomain.com/kavach' 
});
```

---

## Usage

### Passwordless Login
```typescript
async function handleLogin() {
  try {
    // Triggers TouchID/Windows Hello
    const session = await kavach.loginWithBiometrics('user@example.com');
    console.log("Securely authenticated!", session.token);
  } catch (err) {
    console.error("Biometric authentication failed.", err);
  }
}
```

### Step-Up Authentication (MFA)
```typescript
async function transferFunds(amount: number) {
  const isVerified = await kavach.verifyPresence();
  if (isVerified) {
    await api.post('/transfer', { amount });
  }
}
```

---

## Troubleshooting

*   **WebAuthn Not Supported:** Ensure your site is served over HTTPS. WebAuthn APIs are restricted to secure contexts.
*   **Cross-Origin Errors:** Ensure your backend Kavach server has the correct CORS headers configured.

---

## Documentation

*   [Kavach Ecosystem Root](../../README.md)
*   [React Sample](../../samples/kavach-react)

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
