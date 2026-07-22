import { describe, expect, it } from "vitest";
import {
  DECISION_REPLAY_ORDER,
  buildDecisionLineage,
  buildReplayLineageObservability,
  createReplayLineageContract,
  createReplayReference,
  getDecisionReplayLineageContract,
  reconstructDecisionHistory,
  validateDecisionLineage,
  validateReplayIntegrity,
  validateReplayLineageContract,
  validateReplayReferences,
} from "@/services/decision-replay-lineage";
import { createComplianceEvaluation } from "@/services/decision-compliance";
import type { ReplayLineageFailure, ReplayLineageInput } from "@/types/decision-replay-lineage";

describe("Mission Control Phase 9.1.7 Replay & Lineage Contract", () => {
  it("publishes canonical replay order, baseline contract, validation, reconstruction, and observability", () => {
    const framework = getDecisionReplayLineageContract();

    expect(framework.replay_order[0]).toBe("INPUT");
    expect(framework.replay_order).toContain("GOVERNANCE");
    expect(framework.contract.advisory_only).toBe(true);
    expect(framework.replay_validation.validation_status).toBe("VALID");
    expect(framework.lineage_validation.validation_status).toBe("VALID");
    expect(framework.integrity_validation.validation_status).toBe("VALID");
    expect(framework.reconstruction.reconstruction_valid).toBe(true);
  });

  it("creates canonical replay references with supported version, lineage refs, ordering, and reproducible hashes", () => {
    const evaluation = createComplianceEvaluation();
    const ref = createReplayReference({ compliance_evaluation: evaluation, replay_type: "GOVERNANCE", referenced_record_id: evaluation.governance_references[0]!.governance_reference_id });

    expect(ref.replay_type).toBe("GOVERNANCE");
    expect(ref.replay_version).toBe("replay/v1");
    expect(ref.replay_order).toBe(DECISION_REPLAY_ORDER.indexOf("GOVERNANCE") + 1);
    expect(ref.lineage_refs.length).toBeGreaterThan(0);
    expect(ref.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("builds lineage records with parent and child relationships", () => {
    const evaluation = createComplianceEvaluation();
    const lineage = buildDecisionLineage({
      compliance_evaluation: evaluation,
      parent_decision_id: "decision_parent_001",
      child_decision_ids: ["decision_child_001", "decision_child_002"],
    });

    expect(lineage.parent_decision_id).toBe("decision_parent_001");
    expect(lineage.child_decision_ids).toEqual(["decision_child_001", "decision_child_002"]);
    expect(lineage.governance_refs.length).toBeGreaterThan(0);
    expect(lineage.constitutional_refs.length).toBeGreaterThan(0);
    expect(lineage.authority_refs.length).toBeGreaterThan(0);
  });

  it("reconstructs historical decision state deterministically", () => {
    const first = createReplayLineageContract();
    const second = createReplayLineageContract();
    const reconstruction = reconstructDecisionHistory(first);

    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(reconstruction.reconstructed_sequence).toEqual(first.replay_references.map((ref) => ref.replay_type));
    expect(reconstruction.reconstructed_hash).toBe(first.integrity_hash);
    expect(reconstruction.reconstruction_valid).toBe(true);
  });

  it("validates replay references, lineage, and integrity independently", () => {
    const contract = createReplayLineageContract();

    expect(validateReplayReferences(contract).checks.replay_references_exist).toBe(true);
    expect(validateDecisionLineage(contract).checks.lineage_complete).toBe(true);
    expect(validateReplayIntegrity(contract).checks.integrity_hashes_reproducible).toBe(true);
  });

  it.each([
    ["MISSING_REFERENCE", "MISSING_REFERENCE"],
    ["DUPLICATE_REFERENCE", "DUPLICATE_REPLAY_REFERENCE"],
    ["ORDER_FAILURE", "REPLAY_ORDER_FAILURE"],
    ["UNSUPPORTED_VERSION", "VERSION_MISMATCH"],
    ["UNKNOWN_REFERENCE", "UNKNOWN_REFERENCE"],
    ["BROKEN_LINEAGE", "BROKEN_LINEAGE"],
    ["INVALID_PARENT", "INVALID_PARENT"],
    ["INVALID_CHILD", "INVALID_CHILD"],
    ["CIRCULAR_LINEAGE", "CIRCULAR_LINEAGE"],
    ["TENANT_VIOLATION", "TENANT_VIOLATION"],
    ["MISSION_VIOLATION", "MISSION_VIOLATION"],
    ["HASH_MISMATCH", "HASH_MISMATCH"],
    ["SERIALIZATION_MISMATCH", "SERIALIZATION_MISMATCH"],
  ] satisfies [ReplayLineageInput["scenario"], ReplayLineageFailure][])("fails closed for %s", (scenario, failure) => {
    const contract = createReplayLineageContract({ scenario });
    const validation = validateReplayLineageContract(contract);

    expect(validation.validation_status).toBe("FAILED_CLOSED");
    expect(validation.failures).toContain(failure);
  });

  it("rejects circular parent relationships explicitly", () => {
    const contract = createReplayLineageContract({ parent_decision_id: createComplianceEvaluation().orchestration_id });
    const circular = createReplayLineageContract({ scenario: "CIRCULAR_LINEAGE" });

    expect(validateReplayLineageContract(contract).failures).toContain("CIRCULAR_LINEAGE");
    expect(validateDecisionLineage(circular).failures).toContain("CIRCULAR_LINEAGE");
  });

  it("reports replay and lineage observability", () => {
    const valid = createReplayLineageContract();
    const orderFailure = createReplayLineageContract({ scenario: "ORDER_FAILURE" });
    const hashFailure = createReplayLineageContract({ scenario: "HASH_MISMATCH" });
    const metrics = buildReplayLineageObservability([valid, orderFailure, hashFailure]);

    expect(metrics.replay_generation_count).toBe(3);
    expect(metrics.replay_validation_failures).toBe(2);
    expect(metrics.lineage_graph_size).toBeGreaterThanOrEqual(3);
    expect(metrics.integrity_mismatches).toBe(1);
    expect(metrics.replay_ordering_violations).toBe(1);
    expect(metrics.historical_reconstruction_success_rate).toBeGreaterThan(0);
  });
});
