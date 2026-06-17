<div align="center">
  <h1>🛡️ rajeev02-kavach-sdk</h1>
  <p><b>Python Backend Client for Kavach Shield Engine</b></p>
</div>

---

**🔗 Source Code:** [Rajeev02/kavachid on GitHub](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-python)


## 📖 Overview
The official Kavach Python SDK. While the frontend SDKs (React, iOS, Android) handle the user-facing biometrics, this SDK is designed strictly for **Backend Microservices** (FastAPI, Flask, Django, etc.). It acts as a high-level wrapper to communicate with your central Kavach Shield Engine (KSE) to evaluate user risk in real-time.

## ✨ Key Features
*   **Risk Engine Integration:** Instantly query the KSE `/v1/kse/evaluate` endpoint to determine if an action should be allowed, blocked, or stepped-up.
*   **Async Support:** Includes both synchronous (`requests`) and fully asynchronous (`aiohttp`/`httpx`) clients for high-concurrency FastAPI servers.
*   **Webhook Verification:** Cryptographically verifies incoming webhooks from the Kavach SaaS platform using HMAC-SHA256 signatures.
*   **Telemetry Parsing:** Helper methods to parse and validate `x-device-fingerprint` headers sent by frontend clients.

## 🏆 Why Use This Library?
*   **Decoupled Security:** Keeps complex security logic out of your main business applications. Let the Shield Engine handle the risk matrix.
*   **Zero-Trust Enforcement:** Easily wrap sensitive API routes with decorators that automatically enforce risk policies.
*   **High Performance:** Connection pooling ensures minimal latency overhead when evaluating risk.

## 🚀 Installation (PyPI)
```bash
pip install rajeev02-kavach-sdk
```

## 💻 Detailed Usage

### 1. Basic Risk Evaluation
```python
from kavach.sdk import KavachShieldClient
from kavach.models import ActionType, SecurityLevel

client = KavachShieldClient("https://api.yourdomain.com", api_key="sk_live_123")

def perform_bank_transfer(user_id, amount, request):
    # Evaluate the risk BEFORE executing the business logic
    decision = client.evaluate(
        user_id=user_id,
        action_type=ActionType.FINANCIAL_TRANSFER,
        security_level=SecurityLevel.CRITICAL,
        ip_address=request.client.host,
        device_fingerprint=request.headers.get("x-device-fingerprint")
    )

    if decision.status == "DENY":
        raise Exception("Access Denied: High Risk Detected")
    elif decision.status == "STEP_UP_REQUIRED":
        raise Exception("401 MFA Required: Please provide biometric verification")

    # Proceed with transfer if status == "ALLOW"
    return "Transfer successful"
```

### 2. FastAPI Decorator Example
```python
from fastapi import FastAPI, Depends
from kavach.sdk.fastapi import require_risk_level

app = FastAPI()

@app.post("/api/v1/delete-account")
@require_risk_level(SecurityLevel.CRITICAL)
async def delete_account():
    # If the user's current session doesn't meet the risk threshold,
    # the decorator automatically returns a 403 or 401 demanding biometrics.
    pass
```