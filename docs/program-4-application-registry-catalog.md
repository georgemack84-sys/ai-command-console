# Program 4 - Application Registry and Catalog

Status: application registry and catalog baseline

Program: Program 4 - Civitas Ecosystem Applications

Phase: P4.2 - Application Registry and Catalog

## Purpose

P4.2 establishes the constitutional application registry and governed ecosystem catalog. It is the authoritative source of truth for application identity, metadata, ownership references, lineage, discovery, lifecycle visibility, and catalog publication.

P4.2 consumes P4.1 application constitutional foundation artifacts and CCI registry, identity, storage, evidence, and audit services. It never deploys, executes, certifies, or governs runtime behavior.

## Lifecycle

```text
REGISTERED
  -> VALIDATED
  -> CATALOGED
  -> ACTIVE
  -> UPDATED
  -> SUPERSEDED
  -> RETIRED
  -> ARCHIVED
```

Historical records remain immutable, and historical aliases remain resolvable.

## Implementation Surface

The repository exposes the P4.2 baseline through:

- `types/application-registry-catalog.ts`
- `services/application-registry-catalog/index.ts`
- `app/api/application-registry-catalog/contract`
- `app/api/application-registry-catalog/registry`
- `app/api/application-registry-catalog/identity`
- `app/api/application-registry-catalog/metadata`
- `app/api/application-registry-catalog/discovery`
- `app/api/application-registry-catalog/catalog`
- `app/api/application-registry-catalog/lineage`
- `app/api/application-registry-catalog/governance`
- `app/api/application-registry-catalog/audit`
- `app/api/application-registry-catalog/certification`
- `app/api/application-registry-catalog/validate`

## Exit Criteria

P4.2 is complete when the application registry is operational, immutable identities are enforced, the catalog is published, discovery is deterministic and duplicate-free, metadata governance is enforced, ownership references resolve through P4.1, lineage is append-only and complete, duplicate registrations are prevented, registry operations generate immutable audit evidence, and catalog data is constitutionally validated before publication.
