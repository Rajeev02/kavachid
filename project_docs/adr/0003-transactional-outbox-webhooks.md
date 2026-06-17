# ADR 0003: Transactional Outbox Pattern for Webhooks 📦

## Status
Accepted

## Context
When auditing security actions (such as logins, role changes, or session revocations), we must log the audit event to the database and publish a webhook notification to external integrations. Emitting webhooks inline within database transactions creates significant latency, risks distributed commit splits if the webhook endpoint is down/slow, and can result in out-of-sync states if database commits fail after the webhook is sent.

## Decision
We adopted the Transactional Outbox Pattern to decouple database actions from webhook delivery.

* **Dual-Write Mitigation**: Audited events write an `OutboxEvent` row into the same PostgreSQL transaction block as the main operation.
* **Polling Dispatcher**: A background service (`OutboxService`) polls untransmitted events from the outbox table every 5 seconds.
* **Reliable Retry**: If a webhook receiver is offline or returns an error, the event's `retryCount` is incremented. The service uses exponential backoff ($2^{\text{retryCount}}$ seconds delay) up to 5 attempts before marking the event as `failed`.
* **Idempotency**: Webhook requests payload includes unique event UUIDs, allowing receivers to discard duplicate deliveries safely.

## Consequences
* **No Inline Network Latency**: Endpoints respond immediately after database commit; webhook dispatching happens asynchronously.
* **Guaranteed Delivery**: Audits are written first; webhooks are retried until successfully processed or explicitly logged as failed.
