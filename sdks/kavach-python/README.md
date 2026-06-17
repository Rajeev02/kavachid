<div align="center">
  <h1>🛡️ rajeev02-kavach-sdk</h1>
  <p><b>Python Backend Client for Kavach Shield Engine</b></p>
</div>

---

## 📖 Overview
The official Kavach Python SDK. While frontend SDKs handle biometrics, this SDK is designed for **Backend Microservices** (FastAPI, Flask, Django). It provides a high-level wrapper to communicate with the Kavach Shield Engine (KSE) risk evaluation endpoints.

## 🚀 Installation (PyPI)
```bash
pip install rajeev02-kavach-sdk
```

## 💻 Usage

```python
from kavach.sdk import KavachShieldClient

client = KavachShieldClient("https://api.yourdomain.com")

# Evaluate an action against your Risk Policies
decision = client.evaluate(
    user_id="user123",
    action_type="transfer",
    security_level=3,
    ip_address="192.168.1.1",
    device_fingerprint="client_fingerprint_here"
)

if decision == "STEP_UP_REQUIRED":
    raise Exception("401 MFA Required")
```