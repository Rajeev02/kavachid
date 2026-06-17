<div align="center">
  <h1>🛡️ @rajeev02/kavach-react-native</h1>
  <p><b>Native React Native SDK for the Kavach Shield Engine</b></p>
</div>

---

## 📖 Overview
The official Kavach React Native SDK. Unlike standard web libraries that fail inside mobile WebViews, this SDK utilizes the **New Architecture (TurboModules & Fabric)** to bridge directly to native iOS `LocalAuthentication` and Android `BiometricPrompt`.

## ✨ Key Features
*   **True Native Biometrics:** Directly triggers FaceID, TouchID, and Android Fingerprint via highly optimized C++ JSI bridges.
*   **Secure Storage:** Automatically stores session tokens in the iOS Keychain and Android Keystore (backed by the hardware Trusted Execution Environment).
*   **Jailbreak/Root Detection:** Built-in heuristics to detect compromised operating systems before allowing authentication.
*   **Offline Mode Support:** Can validate cached biometric credentials even without network connectivity.

## 🏆 Why Use This Library?
*   **Uncompromising Security:** Avoids the vulnerabilities of storing tokens in standard `AsyncStorage`.
*   **Native Performance:** JSI architecture means zero serialization overhead over the React Native bridge.
*   **Graceful Fallbacks:** Automatically falls back to device PIN/Passcode if biometrics are unavailable or locked out.

## 🚀 Installation
```bash
npm install @rajeev02/kavach-react-native
cd ios && pod install
```

## 💻 Detailed Usage

### 1. Initialization
```typescript
import { KavachNativeClient } from '@rajeev02/kavach-react-native';

const kavach = new KavachNativeClient({ 
  serverUrl: 'https://api.yourdomain.com',
  requireHardwareBacked: true // Enforces StrongBox/Secure Enclave
});
```

### 2. Requesting Authentication
```typescript
async function authenticateUser() {
  // Checks if FaceID/Fingerprint is enrolled on the device
  const canAuthenticate = await kavach.isBiometryAvailable();
  
  if (canAuthenticate) {
    try {
      const session = await kavach.loginWithBiometrics('user@example.com', {
         promptMessage: 'Log in to Kavach Secure App'
      });
      // Session is securely stored in Keychain/Keystore!
    } catch (error) {
      // Handle lockout, cancellation, or failure
    }
  }
}
```