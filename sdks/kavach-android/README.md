<div align="center">
  <h1>🛡️ KavachSDK (Android)</h1>
  <p><b>Native Kotlin SDK for the Kavach Ecosystem</b></p>
</div>

---

## 📖 Overview
The official Kavach Android SDK. Built with modern Kotlin Coroutines, it interacts directly with Android's `BiometricPrompt` API to provide secure fingerprint and facial recognition.

## 🚀 Installation (Gradle)
Add the following to your `build.gradle.kts`:
```kotlin
implementation("com.rajeev02.kavach:kavach-sdk:1.0.0")
```

## 💻 Usage

```kotlin
import com.kavach.sdk.KavachClient

val kavach = KavachClient("https://api.yourdomain.com")

lifecycleScope.launch {
    try {
        val session = kavach.loginWithBiometrics("user@example.com")
        println("Success!")
    } catch (e: Exception) {
        println("Failed: ${e.message}")
    }
}
```