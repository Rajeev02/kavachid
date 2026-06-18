# Kavach SDK for Android (`kavach-android`)

Enterprise-grade Native Kotlin Android SDK for the Kavach Shield Engine, utilizing AndroidX Biometrics and Hardware-Backed Keystore.

[![Maven Central](https://img.shields.io/maven-central/v/io.github.rajeev02.kavach/kavach-android.svg?style=flat-square)](https://central.sonatype.com/artifact/io.github.rajeev02.kavach/kavach-android)
[![Language](https://img.shields.io/badge/Language-Kotlin-purple.svg?style=flat-square)]()
[![Platform Support](https://img.shields.io/badge/Platform-Android-lightgrey.svg?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Keywords:** `android`, `kotlin`, `maven-central`, `biometrics`, `fingerprint`, `androidx`, `keystore`, `security`

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

The **Kavach Android SDK** is a pure Kotlin implementation of the Kavach Engine.

It leverages `androidx.biometric.BiometricPrompt` and the Android Keystore system to securely generate cryptographic keys backed by the Trusted Execution Environment (TEE). This ensures that biometric tokens are hardware-bound and virtually immune to root-level software extraction.

---

## ✨ Features

| Feature | Description |
| ------- | ----------- |
| **BiometricPrompt** | Unified interface providing backward compatibility for Fingerprint and Face Unlock across thousands of Android OEM devices. |
| **Keystore Enclave** | Hardware-backed cryptographic operations preventing key exfiltration. |
| **Root Detection** | Detects `su` binaries, Magisk, and unlocked bootloaders. |

---

## 💻 Compatibility Matrix

| Component | Supported Version | Notes |
| :--- | :--- | :--- |
| **Kotlin** | 1.9+ | |
| **Android SDK** | API 24+ (Android 7.0+) | Target API 34 recommended. |
| **Gradle** | 8.0+ | |

---

## 📦 Installation

**Live Package:** [Maven Central: io.github.rajeev02.kavach:kavach-android](https://central.sonatype.com/artifact/io.github.rajeev02.kavach/kavach-android)

### Maven Central
The SDK is hosted on Sonatype Maven Central. Ensure `mavenCentral()` is in your root `settings.gradle` or `build.gradle`, then add the dependency:

```kotlin
dependencies {
    implementation("io.github.rajeev02.kavach:kavach-android:1.0.4")
}
```

---

## ⚡ Quick Start

### 1. Initialization
Initialize the `KavachClient` in your Activity or Fragment context.

```kotlin
import com.kavach.sdk.KavachClient
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle

class LoginActivity : AppCompatActivity() {
    private lateinit var kavach: KavachClient

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        kavach = KavachClient(this)
        
        // Example: Automatically trigger on load
        authenticateUser()
    }
}
```

### 2. Authentication
```kotlin
private fun authenticateUser() {
    kavach.authenticate("Confirm Secure Login") { result ->
        if (result.isSuccess) {
            val token = result.getOrNull()
            println("Authentication Successful. JWT: $token")
            // Navigate to Main Dashboard
        } else {
            println("Authentication Failed: ${result.exceptionOrNull()?.message}")
        }
    }
}
```

---

## 🛠️ Advanced Configuration

### ProGuard / R8 Rules
If you are using aggressive minification in your `release` build type, the Kavach SDK already includes `consumer-rules.pro` which automatically protects required classes. You do **not** need to add any manual ProGuard rules!

---

## 🐛 Troubleshooting

*   **Error: `BIOMETRIC_ERROR_NONE_ENROLLED`:** 
    The user does not have a PIN, Pattern, Password, or Fingerprint enrolled on their Android device. You must gracefully fallback to standard password entry.
*   **Missing Maven Artifact:** 
    Ensure you specify `io.github.rajeev02.kavach:kavach-android` (the group ID recently changed from `.sdk` to `.android`).

---

## 📄 License

This project is completely open-source. It is distributed under the [MIT License](https://opensource.org/licenses/MIT). See the `LICENSE` file in the root repository for more information.
