# Kavach Python SDK (`rajeev02-kavach-sdk`)

Enterprise-grade Python Backend SDK for Kavach Shield Engine integration, offering robust token validation and dynamic risk evaluation.

[![PyPI Version](https://img.shields.io/pypi/v/rajeev02-kavach-sdk.svg?style=flat-square)](https://pypi.org/project/rajeev02-kavach-sdk/)
[![Language](https://img.shields.io/badge/Language-Python_3-blue.svg?style=flat-square)]()
[![Platform Support](https://img.shields.io/badge/Platform-Backend-lightgrey.svg?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Keywords:** `python`, `fastapi`, `django`, `flask`, `pypi`, `security`, `jwt`, `authentication`, `kavach`, `risk-engine`

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

The **Kavach Python SDK** provides server-side utilities to seamlessly integrate FastAPI, Django, and Flask backends with the Kavach Shield Engine.

It exposes asynchronous and synchronous utilities to validate cryptographically signed Kavach JWTs and trigger the KSE risk evaluation endpoint during highly sensitive API requests (e.g., money transfers, password resets).

---

## ✨ Features

| Feature | Description |
| ------- | ----------- |
| **Token Validation** | High-performance verification of WebAuthn JWT signatures (RS256 / Ed25519). |
| **Risk Middleware** | Intercepts requests to check dynamic KSE scores. |
| **Async Ready** | Built with `asyncio` for non-blocking I/O in FastAPI architectures. |

---

## 💻 Compatibility Matrix

| Component | Supported Version | Notes |
| :--- | :--- | :--- |
| **Python** | 3.8+ | |
| **FastAPI** | 0.95+ | Native `Depends` support. |
| **Django** | 3.2+ | |

---

## 📦 Installation

Install via PyPI:

```bash
pip install rajeev02-kavach-sdk
```

*(Note: We highly recommend using a virtual environment like `venv` or `poetry`)*

---

## ⚡ Quick Start

### Basic Usage (FastAPI Example)
Integrating Kavach into FastAPI is as simple as adding a Dependency Injector.

```python
from fastapi import FastAPI, Depends, HTTPException
from kavach.auth import verify_token

app = FastAPI()

@app.get("/secure-data")
async def read_data(user=Depends(verify_token)):
    """
    This endpoint is automatically protected.
    If the JWT is invalid or the risk score is too high, 
    verify_token will raise a 401 HTTP exception.
    """
    return {"message": "Access Granted to Highly Sensitive Data!", "user": user}
```

---

## 🛠️ Advanced Configuration

### Environment Variables
You must supply the public key matching the private key your Kavach Core server uses to sign JWTs.

Create a `.env` file in your Python project root:
```env
KAVACH_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----"
KAVACH_CORE_URL="https://api.yourdomain.com/kavach"
```

---

## 🐛 Troubleshooting

*   **Invalid JWT Signatures (`SignatureVerificationError`):** 
    Ensure the Python server has the correct `KAVACH_PUBLIC_KEY` loaded. If your keys rotated on the core Node.js KSE server, you must update your Python environment.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
