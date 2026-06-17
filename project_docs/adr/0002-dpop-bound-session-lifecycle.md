# ADR 0002: DPoP Cryptographic Token Binding 🔑

## Status
Accepted

## Context
Standard Bearer tokens (JWTs) are susceptible to token theft (replay attacks) if intercepted via Man-in-the-Middle (MitM) attacks, cross-site scripting (XSS), or leakage from database logs. A malicious actor possessing a stolen Bearer token can access APIs unhindered until token expiration.

## Decision
We implemented OAuth 2.0 Demonstrating Proof-of-Possession (DPoP, RFC 9449) at the core protocol level.

* **Client Ephemeral Keypairs**: The client SDK generates an asymmetric ECDSA (ES256) keypair on the device using standard Web Crypto APIs.
* **Binding Claim**: When logging in, the server computes the SHA-256 thumbprint (`jkt`) of the client's public key and embeds it in the access token's `cnf.jkt` claim.
* **Proof Verification**: Every subsequent request must contain a `dpop` header containing a JWT proof signed by the client's private key. The server verifies this proof (matching method, host url, signature, and iat clock skew) and ensures the signer's thumbprint matches the token's `cnf.jkt` claim.
* **Refresh Token Rotation (RTR)**: Refresh tokens are bound to session contexts. Reusing a rotated refresh token triggers immediate invalidation of all active sessions associated with the user, mitigating token reuse hijacks.

## Consequences
* **Mitigated Token Theft**: If an access token is stolen, it cannot be replayed on another client machine or path without also possessing the client's private key to sign the DPoP proof.
* **Performance**: ECDSA signature verification is highly performant (~0.03ms per signature under load), posing negligible overhead on resource verification.
