# Stage 3 - Trust Registry & Domains

Stage 3 establishes the canonical Trust Registry and constitutional Trust Domain model for the CATA Trust Framework.

## Role

- Consumes Stage 1 Trust Foundation and Stage 2 Constitutional Compliance Gate.
- Provides canonical immutable trust identities, trust domains, domain boundaries, relationships, policies, metadata, governance records, and registry evidence.
- Enforces tenant and domain isolation.
- Requires explicit constitutional authorization for cross-domain operations.
- Fails closed on unauthorized boundary crossing, invalid ownership, unsigned evidence, or non-deterministic replay.

## Service Contract

- `runTrustRegistryDomains(input)` returns the canonical registry/domain result with replay and integrity hashes.
- `validateTrustRegistryDomains(result)` validates registry identity, domains, relationships, boundaries, policies, metadata, governance, evidence, and readiness.
- `replayTrustRegistryDomains(result)` proves deterministic registry reconstruction.
- `getTrustRegistryDomainsBundle()` publishes doctrine, result, and validation envelope.

## API Surface

All routes require an authenticated workspace member.

- `GET /api/trust-registry-domains/contract`
- `POST /api/trust-registry-domains/validate`
- `GET|POST /api/trust-registry-domains/registry`
- `GET|POST /api/trust-registry-domains/domains`
- `GET|POST /api/trust-registry-domains/relationships`
- `GET|POST /api/trust-registry-domains/boundaries`
- `GET|POST /api/trust-registry-domains/policies`
- `GET|POST /api/trust-registry-domains/metadata`
- `GET|POST /api/trust-registry-domains/governance`
- `GET|POST /api/trust-registry-domains/evidence`
- `GET|POST /api/trust-registry-domains/readiness`

## Qualification

Stage 3 qualifies when all trust identities and domains are immutable, relationships are versioned and replayable, boundaries fail closed, governance ownership is enforced, evidence is signed and replayable, and replay reconstructs the complete registry state.
