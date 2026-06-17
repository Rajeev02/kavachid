# Kavach Go SDK

Go Backend SDK for Kavach Shield Engine integration.

[![Version](https://img.shields.io/badge/version-1.0.4-blue.svg)](https://pkg.go.dev/github.com/Rajeev02/kavachid/sdks/kavach-go)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Platform Support](https://img.shields.io/badge/platform-Go-lightgrey.svg)]()

---

## TL;DR

The Go SDK provides highly concurrent, low-latency utilities to integrate Go backends with the Kavach Shield Engine.

**Who should use it:** Backend engineers building high-throughput Go microservices requiring token validation and KSE integration.

**Quickest way to get started:** Install via `go get`.

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

**Technical Value:** Uses native Goroutines to asynchronously fetch KSE Risk Scores in the background without blocking standard API I/O operations.

---

## Features

| Feature | Description | Status |
| ------- | ----------- | ------ |
| **Token Validation** | Ed25519 / RS256 JWT validation. | Stable |
| **Goroutine Ready** | Thread-safe caching of KSE policies. | Stable |

---

## Compatibility Matrix

| Component | Supported Version |
| :--- | :--- |
| **Go** | 1.20+ |

---

## Quick Start

### Install
```bash
go get github.com/Rajeev02/kavachid/sdks/kavach-go
```

---

## Usage

### Basic Usage
```go
package main

import (
	"fmt"
	"github.com/Rajeev02/kavachid/sdks/kavach-go"
)

func main() {
	kavach := kavach.NewClient("https://api.yourdomain.com/kavach")
	
	valid, err := kavach.VerifyToken("eyJhbG...")
	if err != nil || !valid {
		fmt.Println("Access Denied!")
	} else {
		fmt.Println("Access Granted!")
	}
}
```

---

## Troubleshooting

*   **Module Not Found:** If `go get` fails, ensure your GOPROXY is correctly configured or run `GOPRIVATE=github.com/Rajeev02/kavachid go get ...`.

---

## Documentation

*   [Kavach Ecosystem Root](../../README.md)
*   [pkg.go.dev Reference](https://pkg.go.dev/github.com/Rajeev02/kavachid/sdks/kavach-go)

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
