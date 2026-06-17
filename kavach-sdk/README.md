# @rajeev02/kavach-sdk

The official Unified SDK for integrating with the **Kavach Ecosystem** (Kavach ID and Kavach Shield Engine). 

This SDK provides developers with tools to easily implement cross-platform Identity Management, Biometric Step-ups, Device Fingerprinting, and Dynamic Risk Enforcement.

---

## 📖 Philosophy: Secure by Default, Configurable by Exception
Kavach operates on a zero-trust model powered by the **Kavach Shield Engine (KSE)**. 
- **What is enabled by default:** Device Fingerprinting, VPN/TOR detection, Risk Scoring, and JWT rotation. 
- **What you can disable/configure:** You can lower security levels for specific benign actions (e.g., viewing a catalog) via the Admin Console. 
- **What KSE provides:** KSE silently scores all traffic. If a user performs a high-risk action (Level 3+) or exhibits risky behavior, the SDK will automatically throw a `401 STEP_UP_REQUIRED` demanding Biometrics or OTP.

---

## 🚀 Installation

Install the package via your preferred package manager:

```bash
npm install @rajeev02/kavach-sdk
# or
yarn add @rajeev02/kavach-sdk
```

---

## 💻 Frontend & Mobile Setup

### 1. Web (React / Vanilla JS)
On the web, initialize the `KavachClient` and attach the device fingerprint to your headers before calling your APIs.

```typescript
import { KavachClient, generateDeviceFingerprint } from '@rajeev02/kavach-sdk';

const kavach = new KavachClient({
  serverUrl: 'https://api.yourdomain.com',
  tenantId: 'your-tenant-id'
});

async function makeSecureRequest() {
  const fingerprint = await generateDeviceFingerprint(); // Built-in utility
  const token = await kavach.getAccessToken();

  const response = await fetch('https://api.yourdomain.com/wallet/transfer', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-device-fingerprint': fingerprint
    },
    body: JSON.stringify({ amount: 500 })
  });

  if (response.status === 401) {
    const data = await response.json();
    if (data.decision === 'STEP_UP_REQUIRED') {
      // Trigger FaceID / WebAuthn prompt
      await kavach.loginWithPasskey('user@example.com', fingerprint);
      // Retry request...
    }
  }
}
```

### 2. React Native & Expo
React Native implementations use the exact same `KavachClient`. To generate a native device fingerprint, you can use `expo-device` or `react-native-device-info` alongside the SDK.

```typescript
import { KavachClient } from '@rajeev02/kavach-sdk';
import * as Device from 'expo-device';

const fingerprint = `${Device.osName}|${Device.osVersion}|${Device.modelName}`;
// Pass this fingerprint into your API headers, and KSE handles the rest!
```

### 3. Native iOS (Swift) & Android (Kotlin)
If you are building pure native apps without JavaScript, you construct the telemetry natively and interact directly with your backend's KSE-protected endpoints.

**iOS (Swift):**
```swift
let fingerprint = "\(UIDevice.current.systemName)|\(UIDevice.current.systemVersion)"
var request = URLRequest(url: URL(string: "https://api.yourdomain.com/transfer")!)
request.setValue(fingerprint, forHTTPHeaderField: "x-device-fingerprint")
// Send request...
```

**Android (Kotlin):**
```kotlin
val fingerprint = "${Build.VERSION.RELEASE}|${Build.MODEL}"
val request = Request.Builder()
    .url("https://api.yourdomain.com/transfer")
    .addHeader("x-device-fingerprint", fingerprint)
    .build()
```

### 4. Flutter (Dart)
Similar to native apps, Flutter clients attach standard telemetry headers.

```dart
import 'dart:io';

final fingerprint = '${Platform.operatingSystem}|${Platform.operatingSystemVersion}';
final response = await http.post(
  Uri.parse('https://api.yourdomain.com/transfer'),
  headers: {
    'x-device-fingerprint': fingerprint,
  },
);
```

---

## ⚙️ Backend Integration

### 1. Node.js (Express Middleware)
The SDK includes a highly convenient Express middleware to protect your routes automatically.

```typescript
import express from 'express';
import { kseEnforce } from '@rajeev02/kavach-sdk';

const app = express();

app.post('/wallet/transfer', kseEnforce({
  kseBaseUrl: 'http://localhost:3000', // Your core Kavach backend
  level: 3,                            // High Security
  actionType: 'wallet_transfer',
  productName: 'Kavach Wallet',
  getTenantId: (req) => req.headers['x-tenant-id'] as string,
  getUserId: (req) => req.user.id,     // From your JWT middleware
  getSessionId: (req) => req.session.id
}), (req, res) => {
  // If the code reaches here, KSE has explicitly ALLOWED the action!
  res.json({ success: true, message: 'Transfer Complete' });
});
```

### 2. Python (FastAPI / Flask)
If your microservices are in Python, you can call the Kavach Shield Engine directly via HTTP.

```python
import requests

def kse_enforce(user_id, ip, fingerprint):
    response = requests.post("http://kavach-backend:3000/v1/kse/evaluate", json={
        "tenantId": "default",
        "userId": user_id,
        "sessionId": "session_123",
        "targetSecurityLevel": 3,
        "actionType": "transfer",
        "productName": "Wallet",
        "deviceFingerprint": fingerprint,
        "network": { "ipAddress": ip, "userAgent": "Python Client" }
    })
    
    result = response.json()
    if result["decision"] == "DENY":
        raise Exception("Access Denied")
    if result["decision"] == "STEP_UP_REQUIRED":
        raise Exception("MFA Required")
```

### 3. Go (Golang)
Calling KSE from a Go microservice:

```go
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

func evaluateRisk() {
    payload := map[string]interface{}{
        "tenantId": "default",
        "userId": "user123",
        "targetSecurityLevel": 3,
        "actionType": "transfer",
        "productName": "Wallet",
        "deviceFingerprint": "go-server",
        "network": map[string]string{
            "ipAddress": "127.0.0.1",
        },
    }
    
    jsonValue, _ := json.Marshal(payload)
    resp, _ := http.Post("http://kavach-backend:3000/v1/kse/evaluate", "application/json", bytes.NewBuffer(jsonValue))
    
    // Parse response for ALLOW, DENY, or STEP_UP_REQUIRED
}
```

---

## 🛡️ Support
For detailed policy configuration, please consult the Admin Console. To report SDK issues, please open a GitHub issue.
