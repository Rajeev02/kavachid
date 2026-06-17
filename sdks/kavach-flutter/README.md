<div align="center">
  <h1>🛡️ kavach_flutter</h1>
  <p><b>Dart SDK for the Kavach Ecosystem</b></p>
</div>

---

## 📖 Overview
The official Kavach Flutter SDK. It provides cross-platform biometric authentication by securely bridging down to native iOS FaceID and Android Biometrics through Dart platform channels.

## 🚀 Installation (Pub.dev)
Add the following to your `pubspec.yaml`:
```yaml
dependencies:
  kavach_flutter: ^1.0.0
```

## 💻 Usage

```dart
import 'package:kavach_flutter/kavach_flutter.dart';

final kavach = KavachClient('https://api.yourdomain.com');

void login() async {
  try {
    final session = await kavach.loginWithBiometrics('user@example.com');
    print('Success!');
  } catch (e) {
    print('Authentication failed');
  }
}
```