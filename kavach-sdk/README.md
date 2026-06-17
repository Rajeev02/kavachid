# @kavach/sdk

The official unified SDK for integrating with the **Kavach Ecosystem** (Kavach ID and Kavach Shield Engine).

## Overview
This SDK allows developers to drop Kavach's high-security identity and risk management features directly into their applications.

### Features
* **Biometric Step-Ups:** Seamlessly prompt users for FaceID/TouchID when the Kavach Shield Engine (KSE) demands a step-up for high-risk actions.
* **Device Fingerprinting:** Generate and securely transmit device trust telemetry (jailbreak detection, OS version).
* **SSL Pinning:** Prevent Man-in-the-Middle (MitM) attacks.
* **Session Management:** Secure token rotation and automated retry mechanisms.

## Installation
```bash
npm install @kavach/sdk
```

## Usage Example (Node.js)
```javascript
const kseMiddleware = require('@kavach/sdk/express');

app.post('/transfer', 
  kseMiddleware.enforce({ level: 3, action: 'wallet_transfer' }), 
  (req, res) => {
    // If we reach here, KSE has authorized the request.
    res.json({ success: true });
});
```
