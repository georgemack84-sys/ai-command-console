# Workstream 2 Skill Registry

Phase W2.4 establishes the CAF Skill Registry as the constitutional source of truth for executable skills. It governs discovery, packaging, versioning, dependency resolution, compatibility validation, certification, distribution, lineage, trust references, and production deployment eligibility.

## Operational Baseline

- Phase: `skill-registry/w2.4`
- Readiness identifier: `W2.4-SKILL-REGISTRY-READINESS-001`
- Operational gate: `Skill Registry Operational Gate`
- Passing decision: `SKILL_REGISTRY_OPERATIONAL`
- Upstream anchors: W2.0 CAF Constitutional Foundation, W2.1 Agent Registry, W2.2 Lifecycle Engine, W2.3 Capability Registry

## Contract Surface

- `types/skill-registry.ts` defines decisions, scenarios, failure modes, skill registry records, package records, version lineage, dependency graphs, compatibility outcomes, certification records, discovery, test harness, governance APIs, evidence, readiness, validation, and bundle metadata.
- `services/skill-registry/index.ts` provides deterministic run, validate, replay, and bundle operations.
- `app/api/skill-registry/*` exposes authenticated contract, validation, registry, package, version, dependency, compatibility, certification, discovery, test-harness, governance-API, evidence, and readiness slices.

## Governance Guarantees

- Every skill has a unique identity, exactly one owner, capability mappings, runtime requirements, supported agents, certification status, risk classification, authority requirements, tenant scope, and lifecycle state.
- Packages are immutable, signed, reproducible, versioned, integrity validated, and bound to executable logic, schemas, manifests, policies, configuration, documentation, tests, certification artifacts, and replay artifacts.
- Version management tracks semantic versions, immutable releases, patches, deprecation, retirement, compatibility history, upgrade paths, rollback references, lineage, summaries, and certification linkage.
- Dependency resolution validates existence, versions, circular references, package integrity, capability availability, authority compatibility, and certification compatibility.
- Compatibility validation deterministically reports `Compatible`, `Compatible with Restrictions`, `Upgrade Required`, or `Incompatible`.
- Certification blocks uncertified production execution and records testing, qualification, replay, security, policy, authority, operational approval, expiration, history, and revocation evidence.
- Discovery, exploration, testing, governance APIs, tenant isolation, immutable evidence, and deterministic replay are required for operational readiness.

## Verification

The W2.4 unit suite validates the operational baseline, deterministic replay, upstream anchoring, package and version controls, compatibility, certification, discovery, test harness behavior, governance APIs, evidence integrity, conditional degradation, fail-closed behavior, explicit gate failure, and observation/follow-up outcomes.
