# Workstream 1 - W1.2A Storage Core

W1.2A deploys the durable storage foundation required for platform activation, including deterministic persistence, integrity verification, append-only audit storage, transaction metadata, and recovery foundations.

## Scope

- Owns document persistence, configuration persistence, append-only audit storage, transaction metadata, integrity hashing, and recovery foundations.
- Consumes W1.0 Bootstrap Authority, W1.1A Identity Core, and Security Core.
- Produces storage architecture, persistent storage services, configuration and document repositories, audit ledger/archive/index, transaction metadata registry, integrity engine, backup repository, recovery validation, durability reports, and activation evidence.

## Constitutional Rule

Storage Core cannot activate unless durable persistence, immutable configuration/document history, append-only audit storage, transaction lineage, integrity hashing, recovery validation, restart recovery, and activation evidence all pass. Trust, immutability, and integrity failures fail closed.

## API Surface

- `GET /api/storage-core/contract`
- `POST /api/storage-core/validate`
- `GET|POST /api/storage-core/architecture`
- `GET|POST /api/storage-core/deployment`
- `GET|POST /api/storage-core/configuration`
- `GET|POST /api/storage-core/documents`
- `GET|POST /api/storage-core/audit`
- `GET|POST /api/storage-core/metadata`
- `GET|POST /api/storage-core/integrity`
- `GET|POST /api/storage-core/backup`
- `GET|POST /api/storage-core/readiness`
