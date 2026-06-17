# kavach_flutter

Flutter SDK for the Kavach Shield Engine.

[![Version](https://img.shields.io/badge/version-1.0.4-blue.svg)](https://pub.dev/packages/kavach_flutter)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Platform Support](https://img.shields.io/badge/platform-Flutter-lightgrey.svg)]()

---

## TL;DR

The Flutter SDK provides a unified Dart interface to the native iOS and Android biometric and device fingerprinting APIs.

**Who should use it:** Flutter developers building cross-platform apps requiring high-security biometric authentication.

**Quickest way to get started:** Add `kavach_flutter` to your `pubspec.yaml`.

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

**Technical Value:** Wraps the native `KavachClient` in iOS and Android using standard Flutter `MethodChannel` and Dart FFI to abstract away native complexities.

---

## Features

| Feature | Description | Status |
| ------- | ----------- | ------ |
| **MethodChannels** | Unified native communication layer. | Stable |
| **Biometric Scans** | FaceID/TouchID/Fingerprint integration. | Stable |

---

## Compatibility Matrix

| Component | Supported Version |
| :--- | :--- |
| **Flutter** | 3.0+ |
| **Dart** | 3.0+ |

---

## Quick Start

### Install
Add to your `pubspec.yaml`:
```yaml
dependencies:
  kavach_flutter: ^1.0.4
```

---

## Usage

### Basic Usage
```dart
import 'package:kavach_flutter/kavach_flutter.dart';

void main() async {
  final kavach = KavachClient();
  
  try {
    final token = await kavach.authenticate(reason: "Secure Login");
    print("Token: $token");
  } catch (e) {
    print("Failed: $e");
  }
}
```

---

## Troubleshooting

*   **Missing iOS Permissions:** Ensure `NSFaceIDUsageDescription` is in your iOS `Info.plist`.

---

## Documentation

*   [Kavach Ecosystem Root](../../README.md)
*   [Flutter Sample](../../samples/kavach-flutter)

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
