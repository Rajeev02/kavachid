<div align="center">
  <h1>🛡️ KavachSDK (iOS)</h1>
  <p><b>Native Swift SDK for the Kavach Ecosystem</b></p>
</div>

---

## 📖 Overview
The official Kavach iOS SDK written in pure Swift. It seamlessly integrates with Apple's `LocalAuthentication` framework to provide FaceID and TouchID capabilities, and securely stores session tokens in the iOS Keychain.

## 🚀 Installation (CocoaPods)
Add the following to your `Podfile`:
```ruby
pod 'KavachSDK', '~> 1.0.0'
```

## 💻 Usage

```swift
import KavachSDK

let kavach = KavachClient(serverUrl: "https://api.yourdomain.com")

kavach.loginWithFaceID(email: "user@example.com") { result in
    switch result {
    case .success(let session):
        print("Logged in!")
    case .failure(let error):
        print("Biometric failure")
    }
}
```