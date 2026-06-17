<div align="center">
  <h1>🛡️ kavach_flutter</h1>
  <p><b>Dart SDK for the Kavach Shield Engine</b></p>
</div>

---

**🔗 Source Code:** [Rajeev02/kavachid on GitHub](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-flutter)


## 📖 Overview
The official Kavach Flutter SDK. It provides cross-platform biometric authentication by securely bridging down to native iOS FaceID and Android Biometrics through highly optimized Dart platform channels.

## ✨ Key Features
*   **Write Once, Authenticate Anywhere:** A single Dart API call triggers the correct native UI on both iOS and Android.
*   **Platform Channel Optimization:** Extremely low latency communication between Dart and native layers.
*   **Secure Storage Wrapper:** Includes a built-in wrapper for `flutter_secure_storage` to ensure session tokens are never stored in plain text.
*   **Device Fingerprinting:** Extracts underlying device hardware IDs for risk-engine evaluation.

## 🏆 Why Use This Library?
*   **Saves Development Time:** Eliminates the need to write custom Swift and Kotlin bridging code for authentication.
*   **Type Safety:** 100% null-safe Dart code with strong typing for all API responses.
*   **Consistent UX:** Ensures your users see the OS-standard biometric prompts they trust, rather than custom UI dialogs.

## 🚀 Installation (Pub.dev)
Add to your `pubspec.yaml`:
```yaml
dependencies:
  kavach_flutter: ^1.0.1
```

## 💻 Detailed Usage

### 1. Initialization
```dart
import 'package:kavach_flutter/kavach_flutter.dart';

// Initialize the singleton client
final kavach = KavachClient(
  serverUrl: 'https://api.yourdomain.com',
  enableTelemetry: true // Sends device fingerprints for risk analysis
);
```

### 2. Authenticating
```dart
Future<void> handleLogin() async {
  // Check if hardware is present and enrolled
  final canCheckBiometrics = await kavach.canCheckBiometrics;
  
  if (canCheckBiometrics) {
    try {
      final sessionToken = await kavach.loginWithBiometrics(
        email: 'user@example.com',
        localizedReason: 'Please authenticate to access your secure vault.',
      );
      print('Authentication successful: $sessionToken');
    } catch (e) {
      print('Authentication failed: $e');
    }
  } else {
    print('Device does not support biometrics. Fallback to PIN.');
  }
}
```

## 🌐 The Kavach Ecosystem
Kavach provides native SDKs for all major platforms:

| Platform | Source Code (GitHub) | Package Registry |
| :--- | :--- | :--- |
| **🌍 Web** | [Source Code](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-web) | [NPM: @rajeev02/kavach-web](https://www.npmjs.com/package/@rajeev02/kavach-web) |
| **📱 React Native** | [Source Code](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-react-native) | [NPM: @rajeev02/kavach-react-native](https://www.npmjs.com/package/@rajeev02/kavach-react-native) |
| **🍎 iOS (Swift)** | [Source Code](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-ios) | [CocoaPods: KavachSDK](https://cocoapods.org/pods/KavachSDK) |
| **🤖 Android (Kotlin)** | [Source Code](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-android) | [Maven: com.rajeev02.kavach](https://central.sonatype.com/artifact/com.rajeev02.kavach/kavach-sdk) |
| **🐦 Flutter** | [Source Code](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-flutter) | [Pub.dev: kavach_flutter](https://pub.dev/packages/kavach_flutter) |
| **🐍 Python** | [Source Code](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-python) | [PyPI: rajeev02-kavach-sdk](https://pypi.org/project/rajeev02-kavach-sdk/) |
| **🐹 Go** | [Source Code](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-go) | [pkg.go.dev](https://pkg.go.dev/github.com/Rajeev02/kavachid/sdks/kavach-go) |
