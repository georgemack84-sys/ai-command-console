# Program 3 - CAF Legion Agent Memory and Knowledge

Status: memory and knowledge baseline

Program: Program 3 - Civitas Agent Framework

Phase: P3.4 - Agent Memory and Knowledge

Predecessors:

- [Program 3 - CAF Legion Constitutional Foundation](./program-3-caf-legion-constitutional-foundation.md)
- [Program 3 - CAF Legion Agent Runtime Orchestration](./program-3-caf-legion-agent-runtime-orchestration.md)
- Program 2 CCI Registry, Evidence, and Storage Services

## Purpose

P3.4 establishes constitutional memory and knowledge infrastructure for CAF agents: governed working memory, episodic memory, semantic memory, deterministic retrieval, knowledge indexing, evidence lineage, replay compatibility, storage integration, and governed knowledge sharing.

P3.4 does not define runtime execution, capability composition, agent identity, adaptive learning algorithms, model training, or cross-tenant intelligence.

## Scope

P3.4 defines:

- Memory hierarchy and contracts.
- Working, episodic, and semantic memory.
- Knowledge indexing.
- Deterministic retrieval.
- Memory governance.
- Memory lifecycle management.
- Evidence and lineage integration.
- CCI storage integration.
- Replay-compatible memory.
- Governed knowledge sharing.
- Memory observability and certification.

## Memory Lifecycle

```text
CREATED
  -> INDEXED
  -> ACTIVE
  -> REFERENCED
  -> UPDATED
  -> SUPERSEDED
  -> ARCHIVED
  -> RETIRED
```

Every memory transition is governed, evidence-backed, and replay-compatible.

## Implementation Surface

The repository exposes the P3.4 baseline through:

- `types/caf-memory-knowledge.ts`
- `services/caf-memory-knowledge/index.ts`
- `app/api/caf-memory-knowledge/contract`
- `app/api/caf-memory-knowledge/memory`
- `app/api/caf-memory-knowledge/retrieval`
- `app/api/caf-memory-knowledge/governance`
- `app/api/caf-memory-knowledge/evidence`
- `app/api/caf-memory-knowledge/certification`
- `app/api/caf-memory-knowledge/validate`

## Exit Criteria

P3.4 is complete when the Memory Engine, Knowledge Index, Retrieval Services, Memory Governance Engine, working/episodic/semantic stores, replay adapter, CCI storage integration, observability, evidence lineage, tenant isolation, and certification gate are validated.
