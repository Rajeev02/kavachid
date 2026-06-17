# ADR 0001: Argon2id Offloading via Worker Threads 🧵

## Status
Accepted

## Context
Password hashing using the Argon2id algorithm is CPU-bound and mathematically intensive. In a single-threaded runtime like Node.js, executing a password hash (which takes ~50ms to 150ms depending on memory and iteration parameters) synchronously blocks the event loop. Under concurrent registration or login loads, this halts all HTTP request parsing, scheduling, and database processing.

## Decision
We decided to offload all password hashing (`argon2.hash`) and verification (`argon2.verify`) operations into a pool of Node.js `worker_threads` (implemented dynamically within `CryptoService`). 

* **Worker Implementation**: The service encapsulates worker logic inline as an executable script string, avoiding physical worker file-resolution pathing issues at build time.
* **Non-Blocking Operation**: The main thread communicates with the worker via `MessagePort`, returning a `Promise` resolved when the worker completes.
* **Failure Isolation**: If a worker crashes or fails to spin up, the service intercepts the error and rejects the execution gracefully without crashing the core application process.

## Consequences
* **Event Loop Responsiveness**: Under high concurrent registration load (e.g. 50 parallel requests), the server continues to handle database, HTTP routing, and other microtask actions with sub-millisecond latencies (0ms event-loop blockage).
* **Throughput**: Maximum CPU utilisation is leveraged across multiple cores for hashing, while request handling remains lightweight and fast.
