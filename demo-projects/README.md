# KavachID Demo Applications 🚀

This directory contains standalone, boilerplate integration projects showcasing how to configure and use the KavachID libraries across all platforms.

## 📂 Project Directory Structure

* **`backend-app/`**: Standalone **NestJS** backend demonstrating multi-tenant context extraction (`TenantGuard`), JWT verification (`AuthGuard`), dynamic role checks (`PermissionsGuard`), and transactional outbox auditing (`@Audit`). Runs on `http://localhost:3001`.
* **`web-vanilla-app/`**: **Vanilla HTML/JS** application demonstrating password login, biometric FIDO2 WebAuthn passkeys, DPoP header signing, and silent token rotations using `@kavachid/sdk`.
* **`web-react-app/`**: **React + Vite** application using `@kavachid/react` and `<KavachProvider>` to wrap state contexts and access hooks like `useKavach()`. Runs on `http://localhost:8081`.
* **`mobile-react-native-app/`**: **React Native (TS)** template showing how to build keychain secure storage adapters (`MobileSecureStorageProvider`) and configure mobile clients.
* **`mobile-android-app/`**: Native **Kotlin** application demonstrating setting up OkHttp with the DPoP authentication interceptor and Jetpack secure storage.
* **`mobile-ios-app/`**: Native **Swift** application illustrating Keychain token storage, SwiftUI view bindings, and Secure Enclave DPoP headers.

---

## 🏃 Launching the Apps

### 1. Standalone NestJS Backend
```bash
cd backend-app
npm install --legacy-peer-deps
npm run start:dev
```
The server will boot on `http://localhost:3001`.

### 2. React Web Client
```bash
cd web-react-app
npm install --legacy-peer-deps
npm run dev
```
The app will run on `http://localhost:8081`.

### 3. Vanilla Web Client
You can run this app directly from any static web server. (e.g. `npx serve web-vanilla-app -l 8082`).
