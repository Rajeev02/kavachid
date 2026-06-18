# Kavach React Native SDK (`@rajeev02/kavach-react-native`)

Enterprise-grade React Native bindings for the Kavach Shield Engine, featuring synchronous JSI execution for zero-latency biometrics.

[![NPM Version](https://img.shields.io/npm/v/@rajeev02/kavach-react-native.svg?style=flat-square)](https://www.npmjs.com/package/@rajeev02/kavach-react-native)
[![Language](https://img.shields.io/badge/Language-TypeScript%20%7C%20C++-blue.svg?style=flat-square)]()
[![Platform Support](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey.svg?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Keywords:** `react-native`, `expo`, `biometrics`, `faceid`, `touchid`, `security`, `jsi`, `turbomodules`, `android`, `ios`

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

The **Kavach React Native SDK** provides ultra-fast bindings to the native iOS and Android Kavach Shield Engine libraries. 

Instead of relying on the legacy asynchronous React Native Bridge, this SDK leverages the **New Architecture (JSI / TurboModules)** for synchronous, zero-latency execution of cryptographic functions and biometric scanning directly from the native thread.

---

## ✨ Features

| Feature | Description |
| ------- | ----------- |
| **TurboModules (JSI)** | Synchronous C++ execution avoiding the legacy RN Bridge. |
| **Native Biometrics** | Triggers FaceID (iOS) and BiometricPrompt (Android) natively. |
| **Hardware Attestation** | Reads Secure Enclave / Keystore properties to verify device integrity. |
| **Expo Compatible** | Full support for bare workflows and Expo prebuilds. |

---

## 💻 Compatibility Matrix

| Component | Supported Version | Notes |
| :--- | :--- | :--- |
| **React Native** | 0.73.x+ | New Architecture (Bridgeless) enabled. |
| **iOS** | iOS 13.0+ | Requires FaceID capabilities. |
| **Android** | Min SDK 24+ | Requires Biometric hardware. |

---

## 📦 Installation

**Live Package:** [NPM: @rajeev02/kavach-react-native](https://www.npmjs.com/package/@rajeev02/kavach-react-native)

```bash
# NPM
npm install @rajeev02/kavach-react-native

# Yarn
yarn add @rajeev02/kavach-react-native
```

### Native Linking (iOS Only)
If you are using a bare React Native project, you must install the CocoaPods dependencies:
```bash
cd ios && pod install && cd ..
```

---

## ⚡ Quick Start

### 1. Requesting Biometric Authentication
```typescript
import { KavachRN } from '@rajeev02/kavach-react-native';

async function processPayment() {
  try {
    // Triggers native FaceID/TouchID prompt seamlessly
    const result = await KavachRN.promptBiometrics("Confirm Payment of $50.00");
    
    if (result.success) {
      console.log("User verified via hardware biometrics.");
      // Proceed with payment API call
    } else {
      console.warn("User canceled the biometric prompt.");
    }
  } catch (error) {
    console.error("Biometric hardware failure:", error);
  }
}
```

---

## 🛠️ Advanced Configuration

### iOS `Info.plist` Configuration
Apple strictly requires a usage description string for FaceID. You must add the following key to your `ios/YourApp/Info.plist`:

```xml
<key>NSFaceIDUsageDescription</key>
<string>We use FaceID to securely authenticate your high-risk transactions.</string>
```

---

## 🐛 Troubleshooting

*   **App Crashes immediately on iOS when calling `promptBiometrics`:** 
    You forgot to add `NSFaceIDUsageDescription` to your `Info.plist`.
*   **Build Failures (Android):** 
    Ensure you are using Gradle 8.0+ and JDK 17 in your `android/build.gradle`.

---

## 📄 License

This project is completely open-source. It is distributed under the [MIT License](https://opensource.org/licenses/MIT). See the `LICENSE` file in the root repository for more information.
