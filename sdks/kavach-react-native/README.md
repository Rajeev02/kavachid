<div align="center">
  <h1>🛡️ @rajeev02/kavach-react-native</h1>
  <p><b>Native React Native SDK for the Kavach Ecosystem</b></p>
</div>

---

## 📖 Overview
The official Kavach React Native SDK. This library utilizes the **New Architecture (TurboModules & Fabric)** to provide ultra-fast, native device fingerprinting and biometric step-up authentication. 

Unlike browser-based WebAuthn which fails in mobile webviews, this SDK bridges directly to native iOS `LocalAuthentication` (FaceID/TouchID) and Android `BiometricPrompt`.

## 🚀 Installation

```bash
npm install @rajeev02/kavach-react-native
# For iOS:
cd ios && pod install
```

## 💻 Usage

```typescript
import { KavachNativeClient } from '@rajeev02/kavach-react-native';

const kavach = new KavachNativeClient({ serverUrl: 'https://api.yourdomain.com' });

// Trigger native FaceID / Biometric Prompt
await kavach.loginWithBiometrics('user@example.com');
```