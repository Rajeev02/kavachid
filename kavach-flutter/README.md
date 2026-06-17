# KavachID Flutter SDK

A native Flutter/Dart SDK for the KavachID Identity & Access Management platform.

## Features
- **Zero Trust Security**: Native DPoP (Demonstrating Proof-of-Possession) bindings.
- **Hardware-Backed Storage**: Uses `flutter_secure_storage` to persist JWT tokens securely inside iOS Keychain and Android Keystore.
- **Native Cryptography**: High-performance RSA key generation for device-bound tokens.
- **Silent Token Rotation**: Automatically handles 401 Unauthorized errors and seamlessly refreshes tokens in the background without disturbing the UI.

## Getting Started

```dart
import 'package:kavachid_sdk/kavach_client.dart';

void main() async {
  final client = KavachClient(
    options: KavachClientOptions(
      serverUrl: 'https://auth.yourdomain.com',
      tenantId: 'your-tenant-uuid',
    )
  );

  // Securely login & generate hardware-bound keys
  final result = await client.login('user@domain.com', 'SecurePassword!');
  print('Success: ${result["accessToken"]}');

  // Perform secure DPoP-signed authenticated requests
  final response = await client.authenticatedFetch('/auth/me');
  print(response.body);
}
```

*Note: This is an architectural skeleton and requires implementation of the DPoP JWS signing algorithms using the `cryptography` package.*
