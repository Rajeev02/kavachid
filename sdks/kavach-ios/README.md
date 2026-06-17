# KavachSDK (iOS)

Native Swift iOS SDK for the Kavach Shield Engine.

[![Version](https://img.shields.io/badge/version-1.0.4-blue.svg)](https://cocoapods.org/pods/KavachSDK)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Platform Support](https://img.shields.io/badge/platform-iOS-lightgrey.svg)]()

---

## TL;DR

A pure Swift implementation of the Kavach Engine allowing hardware-backed FaceID/TouchID integrations.

**Who should use it:** iOS Engineers building native Swift/SwiftUI applications.

**Quickest way to get started:** Add `pod 'KavachSDK'` to your Podfile.

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

**Technical Value:** Directly utilizes Apple's `LocalAuthentication` and `Security` frameworks to ensure biometric data never leaves the Secure Enclave.

---

## Features

| Feature | Description | Status |
| ------- | ----------- | ------ |
| **FaceID / TouchID** | Natively triggers LAContext biometric prompts. | Stable |
| **Keychain Storage** | Cryptographically secures session tokens. | Stable |

---

## Compatibility Matrix

| Component | Supported Version |
| :--- | :--- |
| **Swift** | 5.0+ |
| **iOS** | 13.0+ |

---

## Quick Start

### Install
Add to your `Podfile`:
```ruby
pod 'KavachSDK', '~> 1.0.4'
```
```bash
pod install
```

---

## Usage

### Basic Usage
```swift
import KavachSDK

let kavach = KavachClient.shared

kavach.authenticate(reason: "Login to your account") { result in
    switch result {
    case .success(let token):
        print("Success: \(token)")
    case .failure(let error):
        print("Error: \(error)")
    }
}
```

---

## Troubleshooting

*   **Missing Info.plist Key:** You MUST add `NSFaceIDUsageDescription` to your application's `Info.plist` or the app will crash when attempting to use FaceID.

---

## Documentation

*   [Kavach Ecosystem Root](../../README.md)
*   [iOS Sample](../../samples/kavach-ios)

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
