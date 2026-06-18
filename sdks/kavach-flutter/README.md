# Kavach Flutter SDK (`kavach_flutter`)

Enterprise-grade Flutter bindings for the Kavach Shield Engine, providing cross-platform Biometric and FIDO2 integration.

[![Pub.dev Version](https://img.shields.io/pub/v/kavach_flutter.svg?style=flat-square)](https://pub.dev/packages/kavach_flutter)
[![Language](https://img.shields.io/badge/Language-Dart-blue.svg?style=flat-square)]()
[![Platform Support](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey.svg?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Keywords:** `flutter`, `dart`, `pub.dev`, `biometrics`, `faceid`, `touchid`, `security`, `methodchannels`

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

The **Kavach Flutter SDK** provides a unified, cross-platform Dart interface to the highly secure native iOS (Swift) and Android (Kotlin) biometric and device fingerprinting APIs.

By utilizing standard Flutter `MethodChannels` and Dart FFI, it abstracts away complex OS-level cryptographic operations, allowing Flutter developers to seamlessly deploy military-grade biometric authentication.

---

## ✨ Features

| Feature | Description |
| ------- | ----------- |
| **MethodChannels** | Unified native communication layer built explicitly for iOS and Android. |
| **Biometric Scans** | FaceID/TouchID (iOS) and BiometricPrompt (Android) integration. |
| **Cross-Platform Telemetry** | Automatically gathers anonymized device fingerprints for KSE risk scoring. |

---

## 💻 Compatibility Matrix

| Component | Supported Version | Notes |
| :--- | :--- | :--- |
| **Flutter** | 3.0+ | |
| **Dart** | 3.0+ | Sound null-safety required. |
| **iOS** | iOS 13.0+ | |
| **Android** | Min SDK 24+ | |

---

## 📦 Installation

**Live Package:** [Pub.dev: kavach_flutter](https://pub.dev/packages/kavach_flutter)

Add `kavach_flutter` to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  kavach_flutter: ^1.0.4
```

Then, run:
```bash
flutter pub get
```

---

## ⚡ Quick Start

### 1. Initialization
```dart
import 'package:kavach_flutter/kavach_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final kavach = KavachClient();
  
  // Example call
  await performSecureLogin(kavach);
}
```

### 2. Authentication
```dart
Future<void> performSecureLogin(KavachClient kavach) async {
  try {
    // Triggers FaceID/BiometricPrompt
    final token = await kavach.authenticate(reason: "Secure Login Required");
    print("Authentication Successful! JWT Token: $token");
    
    // Navigate to next screen
  } catch (e) {
    print("Biometric Authentication Failed: $e");
  }
}
```

---

## 🛠️ Advanced Configuration

### iOS Configuration
You must add `NSFaceIDUsageDescription` to your `ios/Runner/Info.plist`:

```xml
<key>NSFaceIDUsageDescription</key>
<string>We need FaceID to securely verify your identity.</string>
```

---

## 🐛 Troubleshooting

*   **`MissingPluginException`:** 
    If you see this on Android or iOS, ensure you have completely stopped the app and run `flutter run` again. Hot Restart will not compile newly added native MethodChannels.

---

## 📄 License

This project is completely open-source. It is distributed under the [MIT License](https://opensource.org/licenses/MIT). See the `LICENSE` file in the root repository for more information.
