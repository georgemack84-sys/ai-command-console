# Workstream 1 - W1.1A Identity Core

W1.1A activates production identity infrastructure and transfers identity authority from bootstrap authority to production identity authority.

## Scope

- Owns platform identity, identity authority, tenant identity, namespace identity, identity registry, authentication services, authorization services, identity tokens, credentials, lifecycle, trust chain, and audit evidence.
- Consumes W1.0 Bootstrap Authority plus storage and security core capabilities.
- Produces production identity authority, platform/tenant/namespace registries, authentication and authorization services, token service, signed tokens, lifecycle evidence, and immutable identity audit records.

## Constitutional Rule

Identity Core cannot activate unless bootstrap authority is valid, authority transfer is evidenced, identity registries are unique and operational, authentication rejects invalid credentials, authorization denies unauthorized requests, tokens are signed deterministically, lifecycle transitions are reproducible, and audit evidence is immutable.

## API Surface

- `GET /api/identity-core/contract`
- `POST /api/identity-core/validate`
- `GET|POST /api/identity-core/foundation`
- `GET|POST /api/identity-core/transfer`
- `GET|POST /api/identity-core/platform`
- `GET|POST /api/identity-core/tenants`
- `GET|POST /api/identity-core/namespaces`
- `GET|POST /api/identity-core/authentication`
- `GET|POST /api/identity-core/authorization`
- `GET|POST /api/identity-core/tokens`
- `GET|POST /api/identity-core/lifecycle`
- `GET|POST /api/identity-core/audit`
- `GET|POST /api/identity-core/readiness`
