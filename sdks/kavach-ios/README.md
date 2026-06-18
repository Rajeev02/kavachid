# Kavach SDK for iOS (`KavachSDK`)

Enterprise-grade Native Swift iOS SDK for the Kavach Shield Engine, utilizing Apple's LocalAuthentication and Secure Enclave frameworks.

[![CocoaPods Version](https://img.shields.io/cocoapods/v/KavachSDK.svg?style=flat-square)](https://cocoapods.org/pods/KavachSDK)
[![Language](https://img.shields.io/badge/Language-Swift_5-orange.svg?style=flat-square)]()
[![Platform Support](https://img.shields.io/badge/Platform-iOS-lightgrey.svg?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Keywords:** `ios`, `swift`, `cocoapods`, `faceid`, `touchid`, `localauthentication`, `secure-enclave`, `security`, `biometrics`

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

The **Kavach iOS SDK** is a pure Swift implementation of the Kavach Engine allowing hardware-backed FaceID/TouchID integrations.

It directly utilizes Apple's `LocalAuthentication` and `Security` frameworks to ensure biometric cryptographic data never leaves the iOS Secure Enclave, providing enterprise-grade security for banking, healthcare, and enterprise applications.

---

## ✨ Features

| Feature | Description |
| ------- | ----------- |
| **FaceID / TouchID** | Natively triggers `LAContext` biometric prompts with customized localization. |
| **Keychain Storage** | Cryptographically secures session tokens within the iOS Keychain. |
| **Jailbreak Detection** | Identifies compromised iOS environments before executing sensitive APIs. |

---

## 💻 Compatibility Matrix

| Component | Supported Version | Notes |
| :--- | :--- | :--- |
| **Swift** | 5.0+ | |
| **iOS** | 13.0+ | Required for modern `LAContext` features. |
| **Xcode** | 14.0+ | |

---

## 📦 Installation

**Live Package:** [CocoaPods: KavachSDK](https://cocoapods.org/pods/KavachSDK)

### CocoaPods
CocoaPods is a dependency manager for Cocoa projects. Add the following to your `Podfile`:

```ruby
target 'YourApp' do
  use_frameworks!
  pod 'KavachSDK', '~> 1.0.4'
end
```

Then, run the following command:
```bash
pod install
```

---

## ⚡ Quick Start

### 1. Initialization
Import the framework and access the shared singleton.

```swift
import KavachSDK
import UIKit

class LoginViewController: UIViewController {
    let kavach = KavachClient.shared
    
    @IBAction func loginButtonTapped(_ sender: UIButton) {
        authenticateUser()
    }
}
```

### 2. Authentication
```swift
func authenticateUser() {
    kavach.authenticate(reason: "Login to your secure account") { result in
        DispatchQueue.main.async {
            switch result {
            case .success(let token):
                print("Authentication Successful. JWT: \(token)")
                // Navigate to Main Dashboard
            case .failure(let error):
                print("Authentication Failed: \(error.localizedDescription)")
            }
        }
    }
}
```

---

## 🛠️ Advanced Configuration

### Info.plist Configuration
You **MUST** provide a usage string for FaceID. If you fail to do this, iOS will terminate your application immediately upon calling `.authenticate()`.

Add this to your `Info.plist`:
```xml
<key>NSFaceIDUsageDescription</key>
<string>This app requires FaceID to verify high-risk transactions.</string>
```

---

## 🐛 Troubleshooting

*   **Error: `LAError.biometryNotAvailable`:** 
    The user is running the app on a simulator without FaceID enrolled, or their physical device lacks biometric hardware.
*   **Pod Install Fails:** 
    Run `pod repo update` to ensure your CocoaPods Trunk index is synchronized with the latest version.

---

## 📄 License

This project is completely open-source. It is distributed under the [MIT License](https://opensource.org/licenses/MIT). See the `LICENSE` file in the root repository for more information.
