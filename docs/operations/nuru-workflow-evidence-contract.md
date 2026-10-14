# Nuru workflow evidence contract

Track 1 exposes a small, independently deployable, read-only Nuru workflow surface. It does not activate any external dispatch target.

## Endpoint

`POST /v1/workflow/evidence:retrieve`

Required headers:

| Header | Requirement |
| --- | --- |
| `Authorization` | `Bearer <Nuru application credential>` |
| `X-Correlation-ID` | 8–128 character correlation identifier |
| `Idempotency-Key` | 8–128 character key |

The strict JSON body contains `correlationId`, `idempotencyKey`, `query`, and `resource`. The two body identifiers must exactly match their corresponding headers. The operation is `evidence.retrieve`; the authenticated Nuru principal requires an active grant containing that operation and the exact requested resource.

The success envelope contains typed, read-only canonical evidence (`id`, `title`, `contentType`, `project`, `confidence`, and `retrievedAt`) plus the correlation and idempotency evidence. A repeated request with the same key and identical request is replayed from bounded process memory; reusing the key for different input returns `409 idempotency_conflict`.

The handler has a 30-second retrieval ceiling. Invalid or revoked credentials, absent grants, unrecognized scopes, malformed requests, correlation mismatches, and timeout all fail closed. Unexpected read-path failures return `503 evidence_retrieval_unavailable` and may be retried with the same key.

## Read-only guarantee

The endpoint invokes the canonical Nuru search service only. It does not invoke discovery retrieval, candidate intake, curation, audit creation, or any workflow dispatch operation. It therefore cannot mutate Nuru domain records through this interface.

## Health

`GET /v1/workflow/health` returns contract version and read-only status only. It intentionally contains no tenant data, configured endpoints, or credentials.
