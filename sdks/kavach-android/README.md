<div align="center">
  <h1>🛡️ KavachSDK (Android)</h1>
  <p><b>Native Kotlin SDK for the Kavach Shield Engine</b></p>
</div>

---

**🔗 Source Code:** [Rajeev02/kavachid on GitHub](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-android)


## 📖 Overview
The official Kavach Android SDK. Built from the ground up using modern Kotlin Coroutines and Flows, it interacts directly with AndroidX `BiometricPrompt` and the Android Keystore system.

## ✨ Key Features
*   **StrongBox TEE Backed:** Cryptographic keys are stored in the Trusted Execution Environment (TEE) or StrongBox, providing bank-grade security.
*   **Unified Biometric API:** Handles the fragmentation of Android hardware natively—whether it's an ultrasonic fingerprint reader, optical scanner, or 3D facial recognition.
*   **Coroutines Support:** Fully asynchronous, non-blocking API designed for modern Android architecture components.
*   **Encrypted SharedPreferences:** Token storage is automatically encrypted using AES-256-GCM.

## 🏆 Why Use This Library?
*   **Fixes Android Fragmentation:** You don't have to worry about the differences between Samsung, Pixel, and Xiaomi biometric APIs. Kavach handles it all.
*   **Lifecycle Aware:** The SDK respects Android Activity lifecycles, ensuring biometrics aren't triggered when the app is in the background.
*   **Modern Kotlin:** No legacy Java callbacks. Clean, idiomatic Kotlin code.

## 🚀 Installation (Maven Central)
Add to your `build.gradle.kts`:
```kotlin
implementation("io.github.rajeev02.kavach:kavach-sdk:1.0.1")
```

## 💻 Detailed Usage

### 1. Setup in Activity/Fragment
```kotlin
import com.kavach.sdk.KavachClient
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {
    private val kavach = KavachClient("https://api.yourdomain.com")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        findViewById<Button>(R.id.loginBtn).setOnClickListener {
            performBiometricLogin()
        }
    }

    private fun performBiometricLogin() {
        lifecycleScope.launch {
            try {
                // Suspends until the user scans their fingerprint
                val session = kavach.loginWithBiometrics(
                    activity = this@LoginActivity, 
                    email = "user@example.com",
                    title = "Sign In",
                    subtitle = "Confirm your fingerprint to continue"
                )
                // Navigation to home screen
            } catch (e: KavachAuthException) {
                // Handle lockout or hardware errors
            }
        }
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
| **🤖 Android (Kotlin)** | [Source Code](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-android) | [Maven: io.github.rajeev02.kavach](https://central.sonatype.com/artifact/io.github.rajeev02.kavach/kavach-sdk) |
| **🐦 Flutter** | [Source Code](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-flutter) | [Pub.dev: kavach_flutter](https://pub.dev/packages/kavach_flutter) |
| **🐍 Python** | [Source Code](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-python) | [PyPI: rajeev02-kavach-sdk](https://pypi.org/project/rajeev02-kavach-sdk/) |
| **🐹 Go** | [Source Code](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-go) | [pkg.go.dev](https://pkg.go.dev/github.com/Rajeev02/kavachid/sdks/kavach-go) |
