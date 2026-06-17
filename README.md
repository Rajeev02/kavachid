# Kavach Ecosystem

Welcome to the **Kavach Ecosystem** repository. Kavach is a modern, adaptive security and identity platform designed to protect both enterprise B2B customers and end consumers.

## 🚀 The Platform Offering (For B2B & Developers)
Kavach acts as a high-security Identity and Risk Management platform (similar to Auth0 or Okta, but with deep behavioral security). 

* **Kavach ID (Identity Provider):** A multi-tenant authentication backend supporting Passkeys (WebAuthn), JWTs, Federation, and Role-Based Access Control (RBAC).
* **Kavach Shield Engine (KSE):** Our flagship enterprise risk engine. KSE scores every API request based on Device Trust, Network IP (VPN/TOR detection), and User Behavior to stop fraud before it happens.
* **Kavach SDK (`kavach-sdk`):** A unified library that developers can drop into their own apps to instantly get biometric step-ups, SSL pinning, and secure session management.
* **Customizable Policies:** Through the Admin Console, businesses can implement the **"Secure by Default, Configurable by Exception"** paradigm, lowering friction for generic features while strictly guarding financial actions.

## 🛍️ The Product Ecosystem (For Consumers)
For everyday users interacting with Kavach's own suite of apps (Wallet, Travel, Store, Rewards), we offer:

* **Frictionless "Invisible" Security:** Because KSE is adaptive, users aren't annoyed by constant OTPs or captchas. Security only "steps up" (asking for FaceID/OTP) when they do something sensitive, like a Level 3 Wallet Transfer.
* **A Unified Ecosystem:** A single, highly secure identity seamlessly connects Kavach Wallet funds with Kavach Travel bookings and Kavach Rewards.
* **Ultimate Protection:** Users can trust their money is safe. Even if someone steals a password, KSE blocks the attacker because the device fingerprint, network (VPN), and behavior won't match the real user's profile.

---

## 📁 Repository Structure

* `src/` - The core Kavach ID backend and Kavach Shield Engine (KSE) implementation.
* `kavach-sdk/` - The unified SDK for clients to integrate with Kavach.
* `admin-console/` - The React-based admin dashboard for managing policies.
* `samples/` - Official examples demonstrating how to integrate Kavach into various platforms (React, React Native, iOS, Android, Express).

## 🛠️ Quick Start

### 1. Start the Database
Ensure Docker is installed, then run:
```bash
docker compose up -d db
```

### 2. Push Schema & Generate Client
```bash
npx prisma db push
npx prisma generate
```

### 3. Run the Backend
```bash
npm install
npm run start:dev
```

### 4. Run the KSE Integration Test
```bash
npx ts-node test-kse.ts
```
