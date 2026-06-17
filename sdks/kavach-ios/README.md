<div align="center">
  <h1>🛡️ KavachSDK (iOS)</h1>
  <p><b>Native Swift SDK for the Kavach Shield Engine</b></p>
</div>

---

**🔗 Source Code:** [Rajeev02/kavachid on GitHub](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-ios)


## 📖 Overview
The official Kavach iOS SDK written in pure Swift. Designed for native iOS applications, it provides deep integration with Apple's `LocalAuthentication` framework and the Secure Enclave processor.

## ✨ Key Features
*   **Secure Enclave Integration:** Cryptographic keys are generated and stored exclusively within the iPhone's Secure Enclave, making them physically impossible to extract.
*   **FaceID & TouchID:** Seamless presentation of the native Apple biometric UI.
*   **Keychain Access:** High-level wrappers for saving, retrieving, and securely deleting session tokens using `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`.
*   **Device Attestation:** Validates device integrity using Apple's DeviceCheck APIs.

## 🏆 Why Use This Library?
*   **First-Party Performance:** Written entirely in Swift 5+, guaranteeing minimal memory footprint and maximum performance.
*   **Zero Third-Party Dependencies:** Does not rely on Alamofire or other heavy networking libraries. It uses pure `URLSession`.
*   **Enterprise-Grade Security:** Meets strict compliance requirements (SOC2, HIPAA) by guaranteeing hardware-backed key attestation.

## 🚀 Installation

### CocoaPods
```ruby
pod 'KavachSDK', '~> 1.0.1'
```
### Swift Package Manager (SPM)
Add `https://github.com/Rajeev02/kavachid.git` in Xcode -> File -> Add Packages.

## 💻 Detailed Usage

### 1. Initialization
```swift
import KavachSDK

let kavach = KavachClient(serverUrl: "https://api.yourdomain.com")
```

### 2. FaceID Authentication
Make sure to add `NSFaceIDUsageDescription` to your `Info.plist` before calling this!
```swift
kavach.loginWithFaceID(email: "user@example.com", reason: "Access your secure vault") { result in
    DispatchQueue.main.async {
        switch result {
        case .success(let sessionToken):
            print("Successfully authenticated via Secure Enclave!")
            // Token is automatically saved to the iOS Keychain
        case .failure(let error):
            print("Authentication failed: \(error.localizedDescription)")
        }
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
