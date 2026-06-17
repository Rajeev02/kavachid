# Kavach SDK (Android)

Native Kotlin Android SDK for the Kavach Shield Engine.

[![Version](https://img.shields.io/badge/version-1.0.4-blue.svg)](https://central.sonatype.com/artifact/io.github.rajeev02.kavach/kavach-android)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Platform Support](https://img.shields.io/badge/platform-Android-lightgrey.svg)]()

---

## TL;DR

A pure Kotlin implementation of the Kavach Engine utilizing AndroidX Biometrics.

**Who should use it:** Android Engineers building native Kotlin/Compose applications.

**Quickest way to get started:** Add the Maven Central dependency to `build.gradle.kts`.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Compatibility Matrix](#compatibility-matrix)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [License](#license)

*(For global architecture, CI/CD, and security guidelines, see the [Root README](../../README.md))*

---

## Overview

**Technical Value:** Leverages AndroidX BiometricPrompt and the Android Keystore system to securely generate cryptographic keys backed by the Trusted Execution Environment (TEE).

---

## Features

| Feature | Description | Status |
| ------- | ----------- | ------ |
| **BiometricPrompt** | Unified interface for Fingerprint and Face Unlock. | Stable |
| **Keystore Enclave** | Hardware-backed cryptographic operations. | Stable |

---

## Compatibility Matrix

| Component | Supported Version |
| :--- | :--- |
| **Kotlin** | 1.9+ |
| **Android** | API 24+ (Android 7.0+) |

---

## Quick Start

### Install
Add to your `build.gradle.kts`:
```kotlin
dependencies {
    implementation("io.github.rajeev02.kavach:kavach-android:1.0.4")
}
```

---

## Usage

### Basic Usage
```kotlin
import com.kavach.sdk.KavachClient

val kavach = KavachClient(context)

kavach.authenticate("Confirm Transfer") { result ->
    if (result.isSuccess) {
        // Proceed
    }
}
```

---

## Troubleshooting

*   **No Biometrics Configured:** Ensure you handle the `BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED` error gracefully if the user has no PIN or Fingerprint set up.

---

## Documentation

*   [Kavach Ecosystem Root](../../README.md)
*   [Android Sample](../../samples/kavach-android)

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
