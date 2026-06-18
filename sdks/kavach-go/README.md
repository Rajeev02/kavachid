# Kavach Go SDK (`kavach-go`)

Enterprise-grade Go Backend SDK for Kavach Shield Engine integration, designed for high-throughput, low-latency microservices.

[![Go Reference](https://pkg.go.dev/badge/github.com/Rajeev02/kavachid/sdks/kavach-go.svg)](https://pkg.go.dev/github.com/Rajeev02/kavachid/sdks/kavach-go)
[![Language](https://img.shields.io/badge/Language-Go-blue.svg?style=flat-square)]()
[![Platform Support](https://img.shields.io/badge/Platform-Backend-lightgrey.svg?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Keywords:** `go`, `golang`, `microservices`, `security`, `jwt`, `authentication`, `kavach`, `risk-engine`, `goroutines`

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

The **Kavach Go SDK** provides highly concurrent utilities to integrate Go backends with the Kavach Shield Engine.

**Who should use it:** Backend engineers building high-throughput Go microservices (e.g., Gin, Echo, Fiber) requiring rapid token validation and dynamic KSE risk integration without bottlenecking standard API I/O operations.

---

## ✨ Features

| Feature | Description |
| ------- | ----------- |
| **Token Validation** | Ed25519 / RS256 JWT validation leveraging Go's native `crypto` libraries. |
| **Goroutine Ready** | Thread-safe, non-blocking asynchronous fetching of KSE policies. |
| **Memory Optimized** | Zero-allocation JWT parsing techniques for high-load systems. |

---

## 💻 Compatibility Matrix

| Component | Supported Version | Notes |
| :--- | :--- | :--- |
| **Go** | 1.20+ | Recommended to use latest 1.22+. |
| **Frameworks** | Gin, Echo, Fiber, `net/http` | Completely framework agnostic. |

---

## 📦 Installation

**Live Package:** [pkg.go.dev: kavach-go](https://pkg.go.dev/github.com/Rajeev02/kavachid/sdks/kavach-go)

Initialize your go module and fetch the package:

```bash
go get github.com/Rajeev02/kavachid/sdks/kavach-go
```

---

## ⚡ Quick Start

### Basic Usage (`net/http`)
```go
package main

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/Rajeev02/kavachid/sdks/kavach-go"
)

func main() {
	// Initialize Kavach Client singleton
	kavachClient := kavach.NewClient("https://api.yourdomain.com/kavach")

	http.HandleFunc("/secure-data", func(w http.ResponseWriter, r *http.Request) {
		// Extract Bearer Token
		authHeader := r.Header.Get("Authorization")
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// Verify Cryptographic Token
		valid, err := kavachClient.VerifyToken(tokenString)
		if err != nil || !valid {
			http.Error(w, "Access Denied", http.StatusUnauthorized)
			return
		}

		fmt.Fprintln(w, "Access Granted to Highly Sensitive Data!")
	})

	fmt.Println("Server running on :8080")
	http.ListenAndServe(":8080", nil)
}
```

---

## 🛠️ Advanced Configuration

### Caching Risk Profiles
To prevent Go from making synchronous HTTP requests to the core Kavach engine on every single API hit, the SDK supports thread-safe Redis caching.

```go
// Example: Setting up a Redis Cache for KSE Evaluations
kavachClient.SetCache(redisClient, time.Minute * 5)
```

---

## 🐛 Troubleshooting

*   **Module Not Found:** 
    If `go get` fails to find the module, ensure your `GOPROXY` is correctly configured to `https://proxy.golang.org,direct`.
*   **Documentation Not Showing on pkg.go.dev:** 
    Go's indexer caches documentation. If a recent version is missing, manually trigger the indexer by visiting `https://pkg.go.dev/github.com/Rajeev02/kavachid/sdks/kavach-go@latest`.

---

## 📄 License

This project is completely open-source. It is distributed under the [MIT License](https://opensource.org/licenses/MIT). See the `LICENSE` file in the root repository for more information.
