# KavachID Android SDK

A native Android SDK (Kotlin) for the KavachID Identity & Access Management platform.

## Features
- **Zero Trust Security**: Native DPoP (Demonstrating Proof-of-Possession) bindings.
- **Hardware-Backed Storage**: Uses `EncryptedSharedPreferences` to persist JWT tokens securely.
- **Hardware-Backed Cryptography**: Generates RSA keypairs directly inside the `AndroidKeyStore`. The private key can never be extracted from the device hardware, completely mitigating token theft.
- **Silent Token Rotation**: An internal `OkHttp` Interceptor automatically handles 401 Unauthorized errors and seamlessly refreshes tokens in the background.

## Getting Started

```kotlin
import com.kavachid.sdk.KavachClient
import com.kavachid.sdk.KavachClientOptions

val client = KavachClient(
    context = applicationContext,
    options = KavachClientOptions(
        serverUrl = "https://auth.yourdomain.com",
        tenantId = "your-tenant-uuid"
    )
)

// Securely login & generate hardware-bound keys
client.login("user@domain.com", "SecurePassword!") { result ->
    result.onSuccess { token ->
        println("Success: $token")
    }.onFailure { error ->
        println("Login failed: ${error.message}")
    }
}
```

*Note: This is an architectural skeleton and requires full implementation of the DPoP JWS signing algorithms using `java.security.Signature`.*
