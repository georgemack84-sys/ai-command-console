# Workstream 1 - W1.1B Identity Full

W1.1B expands Identity Core into a complete production identity service for sessions, credential lifecycle, recovery, suspension, delegated authorization, federation, evidence, and qualification.

## Scope

- Owns session management, credential lifecycle, identity recovery, identity suspension, delegated authorization, federation interfaces, identity evidence, and identity qualification.
- Consumes W1.1A Identity Core plus storage, messaging, registry, security, and observability platform capabilities.
- Produces active session and credential registries, recovery/suspension/delegation/federation ledgers, immutable identity evidence, readiness assessment, qualification evidence, and the identity certification package.

## Constitutional Rule

Identity Full cannot pass unless tenant-isolated sessions, governed credential lifecycle, recovery authorization, suspension audit, scoped delegation, federation trust, signed immutable evidence, deterministic replay, and infrastructure qualification all pass.

## API Surface

- `GET /api/identity-full/contract`
- `POST /api/identity-full/validate`
- `GET|POST /api/identity-full/sessions`
- `GET|POST /api/identity-full/credentials`
- `GET|POST /api/identity-full/recovery`
- `GET|POST /api/identity-full/suspension`
- `GET|POST /api/identity-full/delegation`
- `GET|POST /api/identity-full/federation`
- `GET|POST /api/identity-full/evidence`
- `GET|POST /api/identity-full/qualification`
- `GET|POST /api/identity-full/readiness`
