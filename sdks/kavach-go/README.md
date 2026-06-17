<div align="center">
  <h1>🛡️ kavach-go</h1>
  <p><b>Go Backend Client for Kavach Shield Engine</b></p>
</div>

---

## 📖 Overview
The official Kavach Go SDK. This package provides strong typings and high-performance HTTP wrappers for Go microservices interacting with the Kavach Shield Engine.

## 🚀 Installation (Go Proxy)
```bash
go get github.com/Rajeev02/kavachid/sdks/kavach-go
```

## 💻 Usage

```go
package main

import (
    "fmt"
    "github.com/Rajeev02/kavachid/sdks/kavach-go/client"
)

func main() {
    kse := client.NewKavachShieldClient("https://api.yourdomain.com")
    
    result, err := kse.Evaluate(client.EvaluationRequest{
        UserID: "user123",
        ActionType: "transfer",
        TargetSecurityLevel: 3,
        IPAddress: "127.0.0.1",
        DeviceFingerprint: "device_id",
    })
    
    if result.Decision == "STEP_UP_REQUIRED" {
        fmt.Println("MFA Required")
    }
}
```