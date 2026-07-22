import { describe, expect, it } from "vitest";
import {
  OUTCOME_REPLAY_CHECKS,
  computeOutcomeReplayBindingHash,
  getOutcomeReplayBinderFoundation,
  replayOutcomeReplayBinder,
  runOutcomeReplayBinder,
} from "@/services/outcome-replay-binder";
import type { OutcomeReplayBinderInput, OutcomeReplayFailure } from "@/types/outcome-replay-binder";

describe("Mission Control Phase 10.2.6 Outcome Replay Binder", () => {
  it("publishes the outcome replay binder foundation", () => {
    const foundation = getOutcomeReplayBinderFoundation();

    expect(foundation.outcome_replay_binder_version).toBe("outcome-replay-binder/v1");
    expect(foundation.checks).toEqual(OUTCOME_REPLAY_CHECKS);
    expect(foundation.api_surface.create_replay_binding).toBe("POST /replay/bind");
    expect(foundation.result.validation.validation_status).toBe("CERTIFIED");
  });

  it("binds replay artifacts without executing replay or mutating outcome records", () => {
    const result = runOutcomeReplayBinder();

    expect(result.binding_only).toBe(true);
    expect(result.executes_replay).toBe(false);
    expect(result.api_surface.executes_replay).toBe(false);
    expect(result.modifies_outcome_records).toBe(false);
  });

  it("creates stable replay binding hashes and replay output", () => {
    const result = runOutcomeReplayBinder();

    expect(computeOutcomeReplayBindingHash(result.replay_binding)).toBe(result.replay_binding.integrity_hash);
    expect(replayOutcomeReplayBinder(result)).toBe(true);
  });

  it("builds a complete replay package", () => {
    const pkg = runOutcomeReplayBinder().replay_package;

    expect(pkg.outcome_identity_ref).toBeTruthy();
    expect(pkg.decision_record_ref).toBeTruthy();
    expect(pkg.recommendation_ref).toBeTruthy();
    expect(pkg.decision_package_ref).toBeTruthy();
    expect(pkg.operator_workflow_ref).toBeTruthy();
    expect(pkg.execution_history_ref).toBeTruthy();
    expect(pkg.observed_outcome_ref).toBeTruthy();
    expect(pkg.truth_ledger_binding_refs.length).toBeGreaterThan(0);
    expect(pkg.evidence_refs.length).toBeGreaterThan(0);
    expect(pkg.historical_lineage_ref).toBeTruthy();
    expect(pkg.integrity_verification_refs.length).toBeGreaterThan(0);
  });

  it("registers ordered replay references and dependency records", () => {
    const result = runOutcomeReplayBinder();

    expect(result.replay_references.length).toBeGreaterThan(0);
    expect(result.replay_references.every((ref, index) => ref.replay_order === index + 1)).toBe(true);
    expect(result.replay_dependencies).toHaveLength(result.replay_references.length - 1);
  });

  it("stores append-only replay registry entries", () => {
    const result = runOutcomeReplayBinder();

    expect(result.reference_registry).toHaveLength(1);
    expect(result.reference_registry[0].append_only).toBe(true);
    expect(result.reference_registry[0].deleted).toBe(false);
  });

  it("publishes advisory-only replay metrics", () => {
    const result = runOutcomeReplayBinder();

    expect(result.metrics.replay_packages_created).toBe(1);
    expect(result.metrics.replay_validation_success_rate).toBe(1);
    expect(result.metrics.replay_divergence_rate).toBe(0);
    expect(result.metrics.advisory_only).toBe(true);
  });

  it("exposes replay binding APIs without update or delete", () => {
    const api = runOutcomeReplayBinder().api_surface;

    expect(api.validate_replay).toBe("POST /replay/validate");
    expect(api.retrieve_replay_package).toBe("GET /replay/{normalized_outcome_id}");
    expect(api.retrieve_replay_dependencies).toBe("GET /replay/{normalized_outcome_id}/dependencies");
    expect(api.compare_replay_results).toBe("POST /replay/compare");
    expect(api.update_supported).toBe(false);
    expect(api.delete_supported).toBe(false);
  });

  it.each([
    ["INVALID_INTEGRITY", "INTEGRITY_NOT_CERTIFIED"],
    ["MISSING_DEPENDENCY", "MISSING_REPLAY_DEPENDENCY_REJECTED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE_REJECTED"],
    ["HASH_MISMATCH", "HASH_MISMATCH_REJECTED"],
    ["LINEAGE_MISMATCH", "LINEAGE_MISMATCH_REJECTED"],
    ["TRUTH_LEDGER_MISMATCH", "TRUTH_LEDGER_MISMATCH_REJECTED"],
    ["EVIDENCE_MISMATCH", "EVIDENCE_MISMATCH_REJECTED"],
    ["CROSS_TENANT_REPLAY", "CROSS_TENANT_REPLAY_REJECTED"],
    ["NONDETERMINISTIC_ORDERING", "REPLAY_ORDERING_NONDETERMINISTIC"],
    ["PACKAGE_MUTATION", "REPLAY_PACKAGE_MUTATION_REJECTED"],
    ["APPEND_ONLY_VIOLATION", "REPLAY_REGISTRY_APPEND_ONLY_VIOLATED"],
    ["INCOMPLETE_DEPENDENCY_GRAPH", "DEPENDENCY_GRAPH_INCOMPLETE"],
    ["FAIL_OPEN", "FAIL_OPEN_REPLAY_BINDING_BEHAVIOR"],
  ] as readonly [NonNullable<OutcomeReplayBinderInput["scenario"]>, OutcomeReplayFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runOutcomeReplayBinder({ scenario });

    expect(result.validation.validation_status).toBe("FAILED");
    expect(result.validation.failures).toContain(failure);
    expect(result.audit_report.certification_decision).toBe("FAIL");
    expect(result.executes_replay).toBe(false);
  });

  it("fails closed when the role lacks replay binder visibility", () => {
    const result = runOutcomeReplayBinder({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("FAILED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects replay binder tampering during replay", () => {
    const result = runOutcomeReplayBinder();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayOutcomeReplayBinder(tampered)).toBe(false);
  });
});
