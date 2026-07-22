import { describe, expect, it } from "vitest";

import {
  buildPersistentIntelligenceFoundation,
  getPersistentIntelligenceFoundationContract,
  replayPersistentIntelligenceFoundation,
  validatePersistentIntelligenceFoundation,
} from "../../../services/persistent-intelligence-foundation";

describe("persistent intelligence foundation", () => {
  it("builds a deterministic certified foundation", () => {
    const first = buildPersistentIntelligenceFoundation();
    const second = buildPersistentIntelligenceFoundation();

    expect(first.status).toBe("PASS");
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validatePersistentIntelligenceFoundation(first).valid).toBe(true);
    expect(replayPersistentIntelligenceFoundation(first)).toBe(true);
  });

  it("preserves the boundary that persistent intelligence is not memory", () => {
    const foundation = getPersistentIntelligenceFoundationContract();

    expect(foundation.doctrine.persistent_intelligence_is_memory).toBe(false);
    expect(foundation.result.contract.memory_substitute).toBe(false);
    expect(foundation.result.contract.advisory_only).toBe(true);
    expect(foundation.result.contract.persistence_rule).toBe("ONLY_CERTIFIED_QUALIFIED_INTELLIGENCE_CAN_BECOME_PERSISTENT");
  });

  it("keeps identity immutable while versions evolve lineage", () => {
    const foundation = buildPersistentIntelligenceFoundation();
    const [rootVersion, certificationVersion, governanceVersion] = foundation.versions;

    expect(foundation.identity.immutable).toBe(true);
    expect(foundation.identity.root_intelligence_id).toBe(foundation.identity.intelligence_id);
    expect(certificationVersion.parent_version_id).toBe(rootVersion.version_id);
    expect(governanceVersion.parent_version_id).toBe(certificationVersion.version_id);
    expect(foundation.versions.every((version) => version.intelligence_id === foundation.identity.intelligence_id)).toBe(true);
  });

  it("enforces registry qualification, tenant isolation, and controlled APIs", () => {
    const foundation = buildPersistentIntelligenceFoundation();

    expect(foundation.registry).toHaveLength(1);
    expect(foundation.registry[0].tenant_isolated).toBe(true);
    expect(foundation.registry[0].qualification_status).toBe("PERSISTENT");
    expect(foundation.qualification_interface.blocks_unqualified_persistence).toBe(true);
    expect(foundation.api_surface.authorization_required).toBe(true);
    expect(foundation.api_surface.mutation_without_version_supported).toBe(false);
  });

  it("runs the complete Phase 11.1 certification matrix", () => {
    const foundation = buildPersistentIntelligenceFoundation();

    expect(foundation.certification.status).toBe("PASS");
    expect(foundation.certification.foundation_allows_object_creation).toBe(true);
    expect(foundation.certification.tests).toHaveLength(33);
    expect(foundation.certification.tests.every((test) => test.passed)).toBe(true);
    expect(foundation.ledger.every((entry, index) => entry.append_only && entry.sequence === index + 1)).toBe(true);
  });

  it("fails closed when a mandatory invariant is violated", () => {
    const foundation = buildPersistentIntelligenceFoundation({ scenario: "TENANT_ISOLATION_BREACH" });
    const validation = validatePersistentIntelligenceFoundation(foundation);

    expect(foundation.status).toBe("FAIL");
    expect(foundation.certification.foundation_allows_object_creation).toBe(false);
    expect(foundation.certification.failures).toContain("TENANT_ISOLATION_BREACH");
    expect(validation.valid).toBe(false);
  });
});
