import { describe, expect, it, vi } from "vitest";
import {
  buildRecoveryReplayObservabilitySurface,
  computeRecoveryReplayResultHash,
  getRecoveryReplayEngineContract,
  runRecoveryReplay,
  validateRecoveryReplay,
} from "@/services/recovery-replay-engine";
import type { RecoveryReplayFailure, RecoveryReplayScenario, RecoveryReplayState } from "@/types/recovery-replay-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.2.6 Recovery Replay Engine", () => {
  it("defines the deterministic advisory-only recovery replay doctrine", () => {
    const contract = getRecoveryReplayEngineContract();

    expect(contract.doctrine.engine_version).toBe("recovery-replay-engine/v8ALT.2.6");
    expect(contract.doctrine.principles).toContain("deterministic-replay");
    expect(contract.doctrine.principles).toContain("immutable-evidence");
    expect(contract.doctrine.replay_states).toEqual(["REPRODUCED", "MISMATCH", "INCOMPLETE", "INVALID"]);
    expect(contract.doctrine.advisory_only).toBe(true);
    expect(contract.validation.valid).toBe(true);
  });

  it("reconstructs failure, planning, dependency, alternative, confidence, recommendation, and governance outputs identically", () => {
    const result = runRecoveryReplay();
    const validation = validateRecoveryReplay(result);

    expect(result.replay_state).toBe("REPRODUCED");
    expect(result.reconstructed_failures.matched).toBe(true);
    expect(result.reconstructed_planning.matched).toBe(true);
    expect(result.reconstructed_dependencies.matched).toBe(true);
    expect(result.reconstructed_alternatives.matched).toBe(true);
    expect(result.reconstructed_confidence.matched).toBe(true);
    expect(result.reconstructed_recommendations.matched).toBe(true);
    expect(result.reconstructed_governance.matched).toBe(true);
    expect(validation.valid).toBe(true);
  });

  it.each([
    ["CONFIDENCE_MISMATCH", "MISMATCH", "CONFIDENCE_MISMATCH"],
    ["RECOMMENDATION_MISMATCH", "MISMATCH", "RECOMMENDATION_MISMATCH"],
    ["DEPENDENCY_GRAPH_MISMATCH", "MISMATCH", "DEPENDENCY_GRAPH_MISMATCH"],
    ["GOVERNANCE_VALIDATION_MISMATCH", "MISMATCH", "GOVERNANCE_VALIDATION_MISMATCH"],
    ["RANKING_MISMATCH", "MISMATCH", "RANKING_MISMATCH"],
    ["INTEGRITY_MISMATCH", "MISMATCH", "INTEGRITY_MISMATCH"],
  ] as readonly [RecoveryReplayScenario, RecoveryReplayState, RecoveryReplayFailure][])("classifies %s as %s", (scenario, state, failure) => {
    const result = runRecoveryReplay({ scenario });
    const validation = validateRecoveryReplay(result);

    expect(result.replay_state).toBe(state);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it.each([
    ["MISSING_FAILURE_EVIDENCE", "MISSING_FAILURE_EVIDENCE"],
    ["MISSING_RECOVERY_PLAN", "MISSING_RECOVERY_PLAN"],
    ["MISSING_DEPENDENCY_GRAPH", "MISSING_DEPENDENCY_GRAPH"],
    ["MISSING_GOVERNANCE_EVIDENCE", "MISSING_GOVERNANCE_EVIDENCE"],
    ["MISSING_REPLAY_REFERENCE", "MISSING_REPLAY_REFERENCE"],
    ["INCOMPLETE_LINEAGE", "INCOMPLETE_LINEAGE"],
  ] as readonly [RecoveryReplayScenario, RecoveryReplayFailure][])("classifies incomplete replay for %s", (scenario, failure) => {
    const result = runRecoveryReplay({ scenario });
    const validation = validateRecoveryReplay(result);

    expect(result.replay_state).toBe("INCOMPLETE");
    expect(result.missing_evidence).toContain(failure);
    expect(validation.failures).toContain(failure);
  });

  it.each([
    ["CORRUPTED_EVIDENCE", "CORRUPTED_EVIDENCE"],
    ["UNAUTHORIZED_RECORD_MUTATION", "UNAUTHORIZED_RECORD_MUTATION"],
    ["TENANT_BOUNDARY_VIOLATION", "TENANT_BOUNDARY_VIOLATION"],
    ["INVALID_REPLAY_REQUEST", "INVALID_REPLAY_REQUEST"],
    ["SCHEMA_VIOLATION", "SCHEMA_VIOLATION"],
    ["EXECUTION_ATTEMPT", "EXECUTION_DETECTED"],
    ["HISTORY_REWRITE_ATTEMPT", "HISTORY_REWRITE_DETECTED"],
    ["FABRICATE_EVIDENCE_ATTEMPT", "EVIDENCE_FABRICATION_DETECTED"],
    ["SUPPRESS_MISMATCH_ATTEMPT", "MISMATCH_SUPPRESSION_DETECTED"],
    ["APPROVAL_ATTEMPT", "APPROVAL_DETECTED"],
  ] as readonly [RecoveryReplayScenario, RecoveryReplayFailure][])("classifies invalid replay for %s", (scenario, failure) => {
    const result = runRecoveryReplay({ scenario });
    const validation = validateRecoveryReplay(result);

    expect(result.replay_state).toBe("INVALID");
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("preserves advisory-only boundaries and never modifies recovery history", () => {
    const result = runRecoveryReplay();
    const validation = validateRecoveryReplay(result);

    expect(result.advisory_only).toBe(true);
    expect(result.recovery_executed).toBe(false);
    expect(result.records_modified).toBe(false);
    expect(result.replay_history_rewritten).toBe(false);
    expect(result.evidence_fabricated).toBe(false);
    expect(result.mismatches_suppressed).toBe(false);
    expect(result.approval_granted).toBe(false);
    expect(validation.advisory_only).toBe(true);
  });

  it("hashes replay results deterministically", () => {
    const first = runRecoveryReplay();
    const second = runRecoveryReplay();

    expect(second.result_hash).toBe(first.result_hash);
    expect(first.result_hash).toBe(computeRecoveryReplayResultHash(first));
  });

  it("exposes operator-visible replay diagnostics", () => {
    const surface = buildRecoveryReplayObservabilitySurface(runRecoveryReplay({ scenario: "MISSING_GOVERNANCE_EVIDENCE" }));

    expect(surface.replay_state).toBe("INCOMPLETE");
    expect(surface.missing_evidence_count).toBe(1);
    expect(surface.integrity_status).toBe("UNVERIFIED");
    expect(surface.advisory_only).toBe(true);
  });
});
