# rajeev02-kavach-sdk (Python)

Python Backend SDK for Kavach Shield Engine integration.

[![Version](https://img.shields.io/badge/version-1.0.4-blue.svg)](https://pypi.org/project/rajeev02-kavach-sdk/1.0.4/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Platform Support](https://img.shields.io/badge/platform-Python-lightgrey.svg)]()

---

## TL;DR

The Python SDK provides server-side utilities to integrate FastAPI, Django, and Flask backends with the Kavach Shield Engine.

**Who should use it:** Python backend engineers implementing Risk-Based Authentication (RBA).

**Quickest way to get started:** Install via pip.

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

**Technical Value:** Exposes asynchronous utilities to validate Kavach JWTs and trigger the KSE risk evaluation endpoint synchronously during API requests.

---

## Features

| Feature | Description | Status |
| ------- | ----------- | ------ |
| **Token Validation** | Validates WebAuthn JWT signatures. | Stable |
| **Risk Middleware** | Intercepts requests to check KSE scores. | Stable |

---

## Compatibility Matrix

| Component | Supported Version |
| :--- | :--- |
| **Python** | 3.8+ |
| **FastAPI** | 0.95+ |

---

## Quick Start

### Install
```bash
pip install rajeev02-kavach-sdk
```

---

## Usage

### Basic Usage (FastAPI Example)
```python
from fastapi import FastAPI, Depends
from kavach.auth import verify_token

app = FastAPI()

@app.get("/secure-data")
def read_data(user=Depends(verify_token)):
    return {"data": "Highly sensitive!", "user": user}
```

---

## Troubleshooting

*   **Invalid JWT Signatures:** Ensure the Python server has the correct `KAVACH_PUBLIC_KEY` loaded in the environment to verify the JWTs signed by the core Node.js KSE server.

---

## Documentation

*   [Kavach Ecosystem Root](../../README.md)
*   [Python API Docs](https://pypi.org/project/rajeev02-kavach-sdk/1.0.4/)

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
