import { describe, expect, it } from "vitest";

import {
  buildInstitutionalMemoryEngine,
  getInstitutionalMemoryContract,
  replayInstitutionalMemoryEngine,
  validateInstitutionalMemoryEngine,
} from "../../../services/institutional-memory-engine";

describe("institutional memory engine", () => {
  it("builds deterministic certified institutional memory", () => {
    const first = buildInstitutionalMemoryEngine();
    const second = buildInstitutionalMemoryEngine();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.available_for_reuse).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateInstitutionalMemoryEngine(first).valid).toBe(true);
    expect(replayInstitutionalMemoryEngine(first)).toBe(true);
  });

  it("keeps institutional memory distinct from adaptive memory", () => {
    const bundle = getInstitutionalMemoryContract();

    expect(bundle.doctrine.institutional_memory_is_adaptive_memory).toBe(false);
    expect(bundle.doctrine.archive_never_delete).toBe(true);
    expect(bundle.doctrine.overwrite_supported).toBe(false);
    expect(bundle.result.contract.supersession_only).toBe(true);
  });

  it("persists all institutional repositories from qualified knowledge", () => {
    const result = buildInstitutionalMemoryEngine();

    expect(result.qualification_certified).toBe(true);
    expect(result.records).toHaveLength(8);
    expect(result.repositories).toHaveLength(8);
    expect(result.repositories.every((repo) => repo.certified && repo.lineage_complete)).toBe(true);
    expect(result.records.every((record) => record.qualification_refs.length > 0)).toBe(true);
  });

  it("enforces immutable versions and deterministic supersession", () => {
    const result = buildInstitutionalMemoryEngine();

    expect(result.versions).toHaveLength(16);
    expect(result.versions.every((version) => version.immutable && version.replayable && version.accessible)).toBe(true);
    expect(result.versions.filter((version) => version.version === "1.1.0").every((version) => version.supersedes_version === "1.0.0")).toBe(true);
  });

  it("replays every institutional domain reproducibly", () => {
    const result = buildInstitutionalMemoryEngine();

    expect(result.replay.point_in_time_reconstruction).toBe(true);
    expect(result.replay.decision_history_replay).toBe(true);
    expect(result.replay.strategy_history_replay).toBe(true);
    expect(result.replay.operational_outcome_replay).toBe(true);
    expect(result.replay.governance_decision_replay).toBe(true);
    expect(result.replay.exception_history_replay).toBe(true);
    expect(result.replay.risk_pattern_replay).toBe(true);
    expect(result.replay.confidence_evolution_replay).toBe(true);
  });

  it("runs the certification matrix and append-only ledger", () => {
    const result = buildInstitutionalMemoryEngine();

    expect(result.certification.tests).toHaveLength(29);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
    expect(result.ledger).toHaveLength(8);
    expect(result.ledger.every((entry, index) => entry.append_only && entry.sequence === index + 1)).toBe(true);
  });

  it("fails closed on replay and governance violations", () => {
    for (const scenario of ["REPLAY_DIVERGENCE", "GOVERNANCE_APPROVAL_MISSING", "CONSTITUTIONAL_VALIDATION_MISSING", "APPEND_ONLY_VIOLATION", "TENANT_ISOLATION_BREACH"] as const) {
      const result = buildInstitutionalMemoryEngine({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.available_for_reuse).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validateInstitutionalMemoryEngine(result).valid).toBe(false);
    }
  });
});
