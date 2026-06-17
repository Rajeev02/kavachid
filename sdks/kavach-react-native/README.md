# @rajeev02/kavach-react-native

React Native (New Architecture) bindings for Kavach Shield Engine.

[![Version](https://img.shields.io/badge/version-1.0.4-blue.svg)](https://www.npmjs.com/package/@rajeev02/kavach-react-native)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Platform Support](https://img.shields.io/badge/platform-React%20Native-lightgrey.svg)]()

---

## TL;DR

The React Native SDK provides ultra-fast JSI bindings to the native iOS and Android Kavach Shield Engine libraries.

**Who should use it:** Mobile engineers building cross-platform React Native apps who need hardware-backed biometrics and device fingerprinting.

**Quickest way to get started:**
```bash
npm install @rajeev02/kavach-react-native
cd ios && pod install
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

**Technical Value:** Leverages React Native's New Architecture (JSI / TurboModules) for zero-latency execution of cryptographic functions and biometric scanning directly from the native thread.

---

## Features

| Feature | Description | Status |
| ------- | ----------- | ------ |
| **TurboModules** | Synchronous JSI execution avoiding the RN Bridge. | Stable |
| **Native Biometrics** | Triggers FaceID (iOS) and BiometricPrompt (Android). | Stable |
| **Hardware Attestation** | Reads Secure Enclave / Keystore properties natively. | Stable |

---

## Compatibility Matrix

| Component | Supported Version |
| :--- | :--- |
| **React Native** | 0.73.x+ (New Architecture enabled) |
| **iOS** | iOS 13.0+ |
| **Android** | Min SDK 24+ |

---

## Quick Start

### Install
```bash
npm install @rajeev02/kavach-react-native
```

### Configure
Link the native dependencies (if not using autolinking):
```bash
cd ios && pod install
```

---

## Usage

### Basic Usage
```typescript
import { KavachRN } from '@rajeev02/kavach-react-native';

async function authenticate() {
  const result = await KavachRN.promptBiometrics("Confirm Payment");
  if (result.success) {
    // Proceed with payment
  }
}
```

---

## Troubleshooting

*   **Build Failures (iOS):** Ensure `pod install` succeeded and that you are opening the `.xcworkspace` (not the `.xcodeproj`).
*   **Build Failures (Android):** Ensure you are using Gradle 8.0+ and JDK 17.

---

## Documentation

*   [Kavach Ecosystem Root](../../README.md)
*   [React Native Sample](../../samples/kavach-react-native)

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
