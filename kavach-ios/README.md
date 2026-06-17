# KavachID iOS SDK

A native iOS SDK (Swift) for the KavachID Identity & Access Management platform.

## Features
- **Zero Trust Security**: Native DPoP (Demonstrating Proof-of-Possession) bindings.
- **Hardware-Backed Storage**: Uses `KeychainAccess` to persist JWT tokens securely in the iOS Keychain.
- **Hardware-Backed Cryptography**: Generates RSA keypairs directly inside the **Secure Enclave** via Apple's `SecKey` APIs. The private key never enters main memory, preventing even sophisticated device-level token theft.
- **Silent Token Rotation**: Automatically handles 401 Unauthorized errors and seamlessly refreshes tokens in the background.

## Getting Started (Swift Package Manager)

Add `https://github.com/Rajeev02/kavachid.git` (or the specific path to `kavach-ios`) as a dependency in your Xcode project using Swift Package Manager.

```swift
import KavachID

let client = KavachClient(
    options: KavachClientOptions(
        serverUrl: "https://auth.yourdomain.com",
        tenantId: "your-tenant-uuid"
    )
)

// Securely login & generate Secure Enclave keys
client.login(identifier: "user@domain.com", password: "SecurePassword!") { result in
    switch result {
    case .success(let token):
        print("Success: \(token)")
    case .failure(let error):
        print("Login failed: \(error.localizedDescription)")
    }
}
```

*Note: This is an architectural skeleton and requires full implementation of the DPoP JWS signing algorithms using `JWTKit` and `SecKey`.*
