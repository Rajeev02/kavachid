<div align="center">
  <h1>🛡️ kavach-go</h1>
  <p><b>Go Backend Client for Kavach Shield Engine</b></p>
</div>

---

**🔗 Source Code:** [Rajeev02/kavachid on GitHub](https://github.com/Rajeev02/kavachid/tree/main/sdks/kavach-go)


## 📖 Overview
The official Kavach Go SDK. Built for scale, this package provides strongly typed, high-performance HTTP and gRPC wrappers for Go microservices interacting with the Kavach Shield Engine (KSE). 

## ✨ Key Features
*   **gRPC & HTTP Support:** Choose between lightweight HTTP REST or ultra-low-latency Protocol Buffers (gRPC) communication with the Engine.
*   **Concurrency Safe:** The `KavachClient` singleton is fully thread-safe and optimized for heavy multi-goroutine workloads.
*   **Context Aware:** Fully supports Go `context.Context` for proper timeout management and request cancellation across microservices.
*   **Advanced Caching:** Optional built-in Redis caching layer to cache repeated risk evaluations and reduce load on the central engine.

## 🏆 Why Use This Library?
*   **Nanosecond Latency:** Designed for environments where adding >5ms overhead to an API route is unacceptable.
*   **Strict Typing:** Eliminates JSON parsing errors with rigidly defined structs for all Risk Policies and Actions.
*   **Enterprise Scale:** Used to secure thousands of requests per second in distributed backend architectures.

## 🚀 Installation (Go Proxy)
```bash
go get github.com/Rajeev02/kavachid/sdks/kavach-go
```

## 💻 Detailed Usage

### 1. Initialization
```go
package main

import (
    "context"
    "fmt"
    "time"
    "github.com/Rajeev02/kavachid/sdks/kavach-go/client"
    "github.com/Rajeev02/kavachid/sdks/kavach-go/models"
)

func main() {
    // Initialize the thread-safe client once
    kse := client.NewKavachShieldClient(client.Config{
        ServerURL: "https://api.yourdomain.com",
        APIKey:    "sk_live_123",
        Timeout:   2 * time.Second,
    })
    
    // ...
}
```

### 2. Evaluating Risk
```go
func handleSensitiveAction(ctx context.Context, kse *client.KavachShieldClient, userID string) {
    req := models.EvaluationRequest{
        UserID:              userID,
        ActionType:          models.ActionDataExport,
        TargetSecurityLevel: models.SecurityLevelHigh,
        IPAddress:           "192.168.1.50",
        DeviceFingerprint:   "ios_device_id_hash",
    }

    result, err := kse.Evaluate(ctx, req)
    if err != nil {
        // Handle engine timeout or networking error
        return
    }

    switch result.Decision {
    case models.DecisionAllow:
        fmt.Println("Action authorized.")
    case models.DecisionDeny:
        fmt.Println("Action blocked due to risk policy.")
    case models.DecisionStepUpRequired:
        fmt.Println("401 MFA Required: Client must provide biometrics.")
    }
}
```