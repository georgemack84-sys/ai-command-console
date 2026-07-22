# W1.7A Security Core

W1.7A deploys the minimum production-grade cryptographic infrastructure required to securely activate the Civitas platform. It establishes deterministic signing, verification, certificate initialization, secret encryption primitives, and immutable bootstrap cryptographic evidence.

## Constitutional Scope

- Owns initial key management, cryptographic signing, cryptographic verification, certificate initialization, secret encryption, and bootstrap cryptographic evidence.
- Consumes W1.0 Platform Bootstrap Authority.
- Explicitly excludes tenant secret vaults, automated key rotation, certificate renewal/revocation/lifecycle management, HSM integration, external PKI federation, key escrow, and policy-driven cryptographic governance. Those belong to W1.7B Security Full.
- Fails closed for invalid bootstrap authority, root key/trust anchor/integrity failures, key integrity failure, nondeterministic signatures, verification failures, trust chain failure, secret protection failure, mutable evidence, or replay failure.

## Implementation

- Contract: `types/security-core.ts`
- Service: `services/security-core/index.ts`
- API: `app/api/security-core/*`
- Tests: `tests/unit/security-core/securityCore.test.ts`

## Qualification

The qualification suite verifies root key initialization, key registry readiness, deterministic signing, verification, certificate chain validation, secret encryption/decryption, immutable evidence, bootstrap security tests, deterministic replay, conditional activation, activation failure, and fail-closed cryptographic defects.

The canonical successful readiness decision is `CORE_ACTIVATED`.
