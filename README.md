# Kavach Ecosystem

The modern, adaptive identity and security platform (Secure by Default, Configurable by Exception).

[![Version](https://img.shields.io/badge/version-1.0.4-blue.svg)](https://github.com/Rajeev02/kavachid)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)]()
[![Platform Support](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web%20%7C%20Flutter-lightgrey.svg)]()
[![Security Scan](https://img.shields.io/badge/security-passing-success.svg)]()
[![Release Status](https://img.shields.io/badge/release-stable-success.svg)]()

---

## TL;DR

Kavach acts as both an Enterprise B2B Platform (offering Identity & Risk APIs to external developers) and a tightly integrated consumer product suite (Wallet, Travel, Store, Rewards). It utilizes the **Kavach Shield Engine (KSE)** to silently score every API request in the background and dynamically trigger biometric step-ups only when anomalous behavior is detected.

**Who should use it:** Enterprise developers, mobile engineers, and security architects looking to implement zero-trust, passwordless authentication (WebAuthn/FIDO2) with minimal friction.

**Quickest way to get started:** Spin up the Docker stack and initialize the backend:
```bash
docker compose up -d db
npx prisma db push && npx prisma generate
npm run start:dev
```

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Compatibility Matrix](#compatibility-matrix)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Observability](#observability)
- [Testing](#testing)
- [Performance](#performance)
- [Deployment](#deployment)
- [CI/CD](#cicd)
- [Developer Workflow](#developer-workflow)
- [Migration Guide](#migration-guide)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Architecture Decision Records (ADR)](#architecture-decision-records-adr)
- [Contributing](#contributing)
- [Changelog](#changelog)
- [License](#license)
- [Support](#support)

---

## Overview

**Problem Statement:** Traditional authentication relies on passwords (vulnerable) and static 2FA/CAPTCHA prompts (high user friction).
**Business Value:** Increases conversion rates by silently authenticating trusted users while maintaining compliance and stopping fraud via the Shield Engine.
**Technical Value:** A unified monorepo providing natively compiled SDKs for all platforms (Swift, Kotlin, TypeScript, Dart, Go, Python) that abstract complex WebAuthn cryptography into a single function call.
**Target Users:** Banks, E-commerce, Healthcare, and any enterprise requiring adaptive Risk-Based Authentication (RBA).
**Use Cases:** Invisible login, high-risk transaction step-ups, VPN/Tor blocking, device fingerprinting.

---

## Features

| Feature | Description | Status |
| ------- | ----------- | ------ |
| **Kavach Shield Engine (KSE)** | Silently scores risk (1-100) on every request based on telemetry. | Stable |
| **WebAuthn / FIDO2** | Hardware-backed passwordless login (FaceID, TouchID, Windows Hello). | Stable |
| **Device Fingerprinting** | Cryptographically links sessions to physical devices. | Stable |
| **Dynamic Step-Up MFA** | Prompts biometric scans ONLY when the user's risk score spikes. | Stable |
| **Admin Console** | React dashboard to configure risk policies and bypass rules. | Beta |

---

## Screenshots

*   **Mobile App:** [Placeholder: iOS Biometric Prompt]
*   **Dashboard:** [Placeholder: Admin Console Risk Rules]
*   **Admin Panel:** [Placeholder: Tenant Overview]
*   **Architecture Diagram:** [Placeholder: KSE Flow Diagram]

---

## Compatibility Matrix

| Component | Supported Version |
| :--- | :--- |
| **Node.js** | 18.x, 20.x, 22.x |
| **React Native** | 0.73.x+ (New Architecture Ready) |
| **Android** | Min SDK 24+ (Android 7.0+) |
| **iOS** | iOS 13.0+ (Swift 5) |
| **Database** | PostgreSQL 14+ |
| **Flutter** | Dart 3.0+ |

---

## Technology Stack

*   **Frontend:** React, React Native, Swift, Kotlin, Flutter
*   **Backend:** Node.js (NestJS / Express), Go, Python (FastAPI/Django)
*   **Database:** PostgreSQL (Prisma ORM)
*   **Infrastructure:** Docker, Kubernetes
*   **Monitoring:** Datadog / Prometheus (WIP)
*   **Analytics:** PostHog
*   **CI/CD:** GitHub Actions, NPM, Maven Central, CocoaPods, PyPI, Pub.dev

---

## Architecture Overview

Instead of showing an OTP prompt on every screen, Kavach silently scores requests:

```mermaid
graph TD;
    A[Client App: iOS/Android/Web] -->|Device Fingerprint + JWT| B(Kavach SDK Middleware)
    B -->|Evaluation Request| C{Kavach Shield Engine}
    C -->|Risk < 30 & Level 1| D[ALLOW: Proceed to API]
    C -->|VPN Detected & Level 3+| E[DENY / STEP_UP]
    E -->|Trigger| F[FaceID / WebAuthn]
    F -->|Success| D
```

**Data Flow:**
1. The SDK captures hardware telemetry locally.
2. The middleware attaches `x-device-fingerprint` to standard HTTP requests.
3. KSE evaluates the request against active Admin Policies.
4. If denied, a `401 STEP_UP_REQUIRED` is returned, instantly triggering the SDK's native biometric scanner.

---

## Project Structure

| Directory | Responsibility |
| :--- | :--- |
| `src/` | The core Node.js backend (Kavach ID Auth & Kavach Shield Engine). |
| `sdks/` | The multi-platform native libraries (`kavach-web`, `kavach-ios`, etc.). |
| `admin-console/` | The React dashboard used to configure KSE risk policies. |
| `samples/` | Boilerplate implementations demonstrating how to integrate the SDKs. |

---

## Prerequisites

*   **Node.js:** v20.x or higher
*   **Docker:** v24.x or higher (for database)
*   **Native Tools:** Xcode (for iOS), Android Studio (for Android)

---

## Quick Start

### Clone
```bash
git clone https://github.com/Rajeev02/kavachid.git
cd kavachid
```

### Install
```bash
npm install
```

### Configure
Copy the environment variables:
```bash
cp .env.example .env
```

### Run
Spin up the database and start the server:
```bash
docker compose up -d db
npx prisma db push && npx prisma generate
npm run start:dev
```

### Verify
```bash
npx ts-node test-kse.ts
```

---

## Environment Configuration

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | PostgreSQL connection string. | `postgresql://user:pass@localhost:5432/kavach` |
| `JWT_SECRET` | Yes | Secret used for signing session tokens. | `super_secret_key` |
| `KSE_STRICT_MODE` | No | Blocks all Tor/VPN traffic by default. | `true` |

---

## Usage

### Basic Usage
The Kavach ecosystem provides drop-in native SDKs. For example, in a React app:

```bash
npm install @rajeev02/kavach-web
```

```typescript
import { KavachClient } from '@rajeev02/kavach-web';
const kavach = new KavachClient({ serverUrl: 'http://localhost:3000' });

// Seamlessly trigger FaceID / TouchID
const session = await kavach.loginWithBiometrics('user@example.com');
```

### Advanced Usage & Real World Examples
Check the `samples/` directory for full production-grade reference implementations:
*   `samples/kavach-react`
*   `samples/kavach-ios`
*   `samples/kavach-android`
*   `samples/kavach-express`

---

## API Documentation

The Kavach Backend exposes several REST endpoints.

**Authentication: `/api/v1/auth/biometric`**
*   **Request:** WebAuthn Attestation Object.
*   **Response:** `{ "token": "jwt...", "riskScore": 12 }`

**Shield Engine Evaluation: `/api/v1/kse/evaluate`**
*   **Request:** `{ "userId": "123", "actionLevel": 3, "ip": "1.1.1.1" }`
*   **Response:** `200 OK` or `401 STEP_UP_REQUIRED`

*(See `docs/api/` for complete Swagger definitions).*

---

## Security

*   **Authentication:** WebAuthn / FIDO2 public-key cryptography. No passwords stored.
*   **Authorization:** JWT with short-lived scopes.
*   **Device Attestation:** Validates iOS Secure Enclave and Android Keystore hardware signatures.
*   **Threat Detection:** Real-time IP reputation, velocity checks, and Tor/VPN detection via KSE.

### Responsible Disclosure
If you find a security vulnerability, please do NOT open a public issue. Email `security@kavachid.org` immediately.

---

## Observability

*   **Logging:** Winston structured JSON logging.
*   **Metrics:** Prometheus endpoints exposed at `/metrics`.
*   **Analytics:** Telemetry events sent to PostHog for admin dashboards.

---

## Testing

### Unit Testing
```bash
npm run test
```

### E2E Testing
```bash
npm run test:e2e
```

### Coverage
```bash
npm run test:cov
```

---

## Performance

*   **Network Optimization:** SDKs aggressively cache policies to minimize round-trips.
*   **Caching Strategy:** Redis is utilized to cache KSE risk profiles, reducing database load to < 5ms per evaluation.

---

## Deployment

Kavach is designed to be self-hosted via Kubernetes or Docker Swarm.

### Production
A production-ready Dockerfile is provided in `src/`.
```bash
docker build -t kavach-core .
docker run -p 3000:3000 kavach-core
```

---

## CI/CD

The repository uses strict GitHub Actions pipelines:
Commit → Build (TSC/Swift/Kotlin) → Test (Jest/XCTest/JUnit) → Security Scan → Release (NPM/Maven/CocoaPods)

To trigger a release across all 6 SDKs simultaneously:
```bash
node bump-version.js
./publish.sh
```

---

## Developer Workflow

**Branch Strategy:**
*   `main`: Production-ready, locked branch.
*   `feature/*`: New SDK capabilities.
*   `fix/*`: Bug fixes.

**Commit Convention:**
We enforce Conventional Commits:
*   `feat: add WebAuthn support`
*   `fix: resolve KSE timeout`
*   `docs: update readme`

---

## Migration Guide

**v1.0.3 → v1.0.4**
*   The Android SDK group ID was migrated to `io.github.rajeev02.kavach`. Update your `build.gradle` accordingly.

---

## Troubleshooting

*   **Installation failures (iOS):** Run `pod install --repo-update` to ensure CocoaPods Trunk is synchronized.
*   **Build failures (Android):** Ensure you are using JDK 17+ and Gradle 8.0+.
*   **NPM EOTP Error:** If `./publish.sh` fails with `EOTP`, you must run it manually in a terminal to satisfy NPM 2FA requirements.

---

## Live Ecosystem Packages

Kavach provides natively compiled, globally published SDKs for all major platforms:

| Platform | Source Code | Live Registry Package |
| :--- | :--- | :--- |
| **🌍 Web** | [sdks/kavach-web](./sdks/kavach-web) | [NPM: @rajeev02/kavach-web](https://www.npmjs.com/package/@rajeev02/kavach-web) |
| **📱 React Native** | [sdks/kavach-react-native](./sdks/kavach-react-native) | [NPM: @rajeev02/kavach-react-native](https://www.npmjs.com/package/@rajeev02/kavach-react-native) |
| **🍎 iOS (Swift)** | [sdks/kavach-ios](./sdks/kavach-ios) | [CocoaPods: KavachSDK](https://cocoapods.org/pods/KavachSDK) |
| **🤖 Android (Kotlin)** | [sdks/kavach-android](./sdks/kavach-android) | [Maven: io.github.rajeev02.kavach](https://central.sonatype.com/artifact/io.github.rajeev02.kavach/kavach-android) |
| **🐦 Flutter** | [sdks/kavach-flutter](./sdks/kavach-flutter) | [Pub.dev: kavach_flutter](https://pub.dev/packages/kavach_flutter) |
| **🐍 Python** | [sdks/kavach-python](./sdks/kavach-python) | [PyPI: rajeev02-kavach-sdk](https://pypi.org/project/rajeev02-kavach-sdk/) |
| **🐹 Go** | [sdks/kavach-go](./sdks/kavach-go) | [pkg.go.dev](https://pkg.go.dev/github.com/Rajeev02/kavachid/sdks/kavach-go) |

---

## Documentation

*   [Web SDK Docs](./sdks/kavach-web/README.md)
*   [React Native SDK Docs](./sdks/kavach-react-native/README.md)
*   [iOS SDK Docs](./sdks/kavach-ios/README.md)
*   [Android SDK Docs](./sdks/kavach-android/README.md)
*   [Flutter SDK Docs](./sdks/kavach-flutter/README.md)
*   [Python SDK Docs](./sdks/kavach-python/README.md)
*   [Go SDK Docs](./sdks/kavach-go/README.md)

---

## Roadmap

*   [ ] Kubernetes Helm Charts
*   [ ] Hardware YubiKey explicit support
*   [ ] Advanced Anomaly Detection ML Models

---

## Architecture Decision Records (ADR)

*See `docs/adr/` for historical decisions.*

---

## Contributing

We welcome contributions!
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'feat: add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## Changelog

See `CHANGELOG.md` for version history.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Support

*   [GitHub Issues](https://github.com/Rajeev02/kavachid/issues)
*   [GitHub Discussions](https://github.com/Rajeev02/kavachid/discussions)
