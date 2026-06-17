<div align="center">
  <h1>🛡️ @rajeev02/kavach-web</h1>
  <p><b>Browser SDK for the Kavach Shield Engine</b></p>
</div>

---

**🔗 Source Code:** [Rajeev02/kavachid on GitHub](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-web)


## 📖 Overview
The Kavach Web SDK provides seamless integration with browser-based WebAuthn and FIDO2 standards. It allows you to rapidly implement phishing-resistant, passwordless authentication (TouchID, Windows Hello, YubiKeys) directly into your React, Vue, or Vanilla JS web applications.

## ✨ Key Features
*   **WebAuthn/FIDO2 Ready:** Instantly trigger native browser biometric prompts.
*   **Device Fingerprinting:** Generates robust, privacy-preserving client identifiers (`x-device-fingerprint`) to prevent session hijacking.
*   **Risk-Based Step-Up:** Automatically challenges the user for biometrics if the backend Kavach Engine detects anomalous behavior.
*   **Cross-Browser Support:** Works flawlessly across Chrome, Safari, Firefox, and Edge.

## 🏆 Why Use This Library?
*   **Zero-Trust Security:** Moves authentication away from vulnerable passwords and SMS OTPs to cryptographic hardware tokens.
*   **Developer Experience:** Reduces complex WebAuthn cryptography into a single, elegant API call.
*   **Plug-and-Play:** Framework agnostic. Drop it into any frontend stack.

## 🚀 Installation
```bash
npm install @rajeev02/kavach-web
```

## 💻 Detailed Usage

### 1. Initialization
```typescript
import { KavachClient } from '@rajeev02/kavach-web';

// Initialize with your backend Kavach engine URL
const kavach = new KavachClient({ 
  serverUrl: 'https://api.yourdomain.com/kavach' 
});
```

### 2. Passwordless Login
```typescript
async function handleLogin() {
  try {
    // Triggers TouchID/Windows Hello
    const session = await kavach.loginWithBiometrics('user@example.com');
    console.log("Securely authenticated!", session.token);
  } catch (err) {
    console.error("Biometric authentication failed or was cancelled.", err);
  }
}
```

### 3. Step-Up Authentication (MFA)
Protect sensitive actions (like transferring money) by requiring immediate biometric verification.
```typescript
async function transferFunds(amount: number) {
  // Verifies the user is physically present before proceeding
  const isVerified = await kavach.verifyPresence();
  if (isVerified) {
    await api.post('/transfer', { amount });
  }
}
```


## 🌐 The Kavach Ecosystem
Kavach provides native SDKs for all major platforms:
- [🌍 Web SDK](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-web)
- [📱 React Native SDK](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-react-native)
- [🍎 iOS SDK (Swift)](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-ios)
- [🤖 Android SDK (Kotlin)](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-android)
- [🐦 Flutter SDK](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-flutter)
- [🐍 Python SDK (Backend)](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-python)
- [🐹 Go SDK (Backend)](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-go)
