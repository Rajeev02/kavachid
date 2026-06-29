# Kavach ID

An adaptive identity and risk evaluation platform implementing passwordless authentication (WebAuthn/FIDO2) and dynamic risk-based policies.

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)]()
[![License](https://img.shields.io/badge/license-UNLICENSED-green.svg)]()

---

## Overview

Kavach ID provides a centralized backend for managing multi-tenant identity, sessions, and device trust. It evaluates user requests against predefined risk policies and device fingerprints to trigger authentication step-ups selectively rather than requiring static, high-friction multifactor authentication on every request.

**Problem Solved:** Balances security and user experience by silently scoring risk levels for incoming requests, invoking biometric verification (via WebAuthn/Passkeys) only when anomalous behavior is detected.

**Scope:** The repository serves as a monorepo containing the core NestJS API backend and a suite of client SDKs to integrate risk-based authentication flows across multiple platforms.

---

## Features

* **Multi-Tenant Identity Management** — Isolates users, devices, sessions, and roles per tenant.
* **Risk-Based Authentication (RBA)** — Evaluates request context against `PolicyRule` schemas to compute a dynamic risk score.
* **Passwordless (WebAuthn)** — Handles credential registration and assertion using `@simplewebauthn` for hardware-backed FaceID/TouchID/Windows Hello flows.
* **Device Fingerprinting & Trust** — Cryptographically binds active sessions to trusted physical devices.
* **Audit & Outbox Pattern** — Maintains immutable audit logs and reliable outbox event propagation for distributed transaction integrity.

---

## Technology Stack

| Category       | Technology |
| -------------- | ---------- |
| Language       | TypeScript |
| Framework      | NestJS / Express |
| Database       | PostgreSQL |
| ORM            | Prisma |
| Authentication | WebAuthn, JWT (JOSE), Argon2 |
| Testing        | Jest, Supertest |
| Infrastructure | Docker, Docker Compose |

---

## Project Structure

```text
.
├── admin-console/    # Frontend for configuring risk policies
├── kubernetes/       # Kubernetes deployment configurations
├── prisma/           # Database schemas and migrations
├── samples/          # Reference implementation examples
├── sdks/
│   ├── kavach-android/
│   ├── kavach-flutter/
│   ├── kavach-go/
│   ├── kavach-ios/
│   ├── kavach-python/
│   ├── kavach-react-native/
│   └── kavach-web/
├── src/              # Core Node.js / NestJS backend implementation
└── test/             # E2E test suites
```

---

## Prerequisites

* **Node.js**: v20 or higher
* **npm**: v9 or higher
* **Docker & Docker Compose**: For local PostgreSQL provisioning
* **TypeScript**: `ts-node` globally available (optional, for running scripts directly)

---

## Installation & Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Rajeev02/kavachid.git
   cd kavachid
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Database Infrastructure:**
   ```bash
   docker-compose up -d db
   ```

4. **Initialize Database Schema:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Start the Application in Development Mode:**
   ```bash
   npm run start:dev
   ```

The API server will run locally. Webhook events can be routed through the mocked webhook listener provided by the `docker-compose.yml`.

---

## Configuration

Environment variables can be provided in a `.env` file or exported to the shell.

| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://kavach:supersecretpassword@localhost:5432/kavachid?schema=public` |
| `PORT` | API server listening port | No | `3000` |
| `KAVACHID_MASTER_KEY` | Master cryptographic key for encryption | Yes (in prod) | *None* |
| `WEBHOOK_URL` | Destination URL for emitted events | No | *None* |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifespan | No | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifespan | No | `7d` |

---

## Testing

The project uses Jest for both unit and end-to-end testing.

**Run unit tests:**
```bash
npm run test
```

**Run tests in watch mode:**
```bash
npm run test:watch
```

**Run End-to-End (E2E) tests:**
```bash
npm run test:e2e
```

**Generate coverage report:**
```bash
npm run test:cov
```

---

## Deployment

A Dockerfile is provided at the root for containerized deployments.

**Build the core image:**
```bash
docker build -t kavach-core .
```

The stack can be deployed utilizing the provided `docker-compose.yml` or the resources in the `kubernetes/` directory for orchestration. Ensure `DATABASE_URL` and `KAVACHID_MASTER_KEY` are injected safely via secrets.

---

## Security

* **Cryptography**: Utilizes `jose` for robust JWT issuance and signature validation. Private keys are securely managed and rotated via the `KeyPair` schema.
* **Passwords**: Uses `argon2` for password hashing, though the primary authentication mechanism defaults to WebAuthn.
* **Device Identity**: DPoP (Demonstrating Proof-of-Possession) public keys are supported to bind tokens strictly to the client device that requested them.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature-name`)
3. Adhere to the existing code style via ESLint and Prettier (`npm run format`, `npm run lint`)
4. Ensure all tests pass (`npm run test`)
5. Submit a pull request detailing your changes

---

## License

This project is currently marked as `UNLICENSED`. Please review repository policies before modifying or distributing.
