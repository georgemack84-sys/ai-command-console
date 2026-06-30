import { describe, expect, it } from "vitest";
import {
  buildRuntimeSupervisionContract,
  buildRuntimeSupervisionObservabilitySurface,
  computeRuntimeSupervisionEvidenceHash,
  computeRuntimeSupervisionIntegrityHash,
  getRuntimeSupervisionContractFramework,
  replayRuntimeSupervisionContract,
  validateRuntimeSupervisionContract,
} from "@/services/runtime-supervision-contract";
import type { RuntimeSupervisionFailureReason, RuntimeSupervisionScenario } from "@/types/runtime-supervision-contract";

describe("Mission Control Phase 8E.A Runtime Supervision Contract", () => {
  it("builds an immutable advisory-only supervision contract with canonical schema fields", () => {
    const contract = buildRuntimeSupervisionContract();

    expect(Object.isFrozen(contract)).toBe(true);
    expect(contract.supervision_version).toBe("runtime-supervision-contract/v8E.A");
    expect(contract.supervision_id).toMatch(/^RSC-/);
    expect(contract.lifecycle_state).toBe("ACTIVE");
    expect(contract.intervention_authority.advisory_only).toBe(true);
    expect(contract.intervention_authority.operator_required).toBe(true);
    expect(contract.intervention_authority.prohibited_actions).toContain("execute_task");
    expect(contract.supervision_scope.restrictions).toContain("no hidden observation channels");
  });

  it("validates the baseline contract", () => {
    const contract = buildRuntimeSupervisionContract();
    const result = validateRuntimeSupervisionContract(contract, { registry: [contract] });

    expect(result.validation_state).toBe("PASS");
    expect(result.failures).toEqual([]);
    expect(result.identity_valid).toBe(true);
    expect(result.monitored_execution_valid).toBe(true);
    expect(result.tenant_aligned).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.ready_for_runtime_supervision).toBe(true);
  });

  it("produces deterministic integrity hashes and replay reconstruction", () => {
    const first = buildRuntimeSupervisionContract();
    const second = buildRuntimeSupervisionContract();
    const replay = replayRuntimeSupervisionContract(first);

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(computeRuntimeSupervisionIntegrityHash(first)).toBe(first.integrity_hash);
    expect(computeRuntimeSupervisionEvidenceHash(first.supervision_evidence)).toBe(first.supervision_evidence.integrity_hash);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.reconstructed_lifecycle).toEqual(["DRAFT", "VALIDATING", "ACTIVE"]);
    expect(replay.reconstructed_confidence_level).toBe("HIGH");
  });

  it.each([
    ["MISSING_IDENTITY", "SUPERVISION_ID_MISSING"],
    ["MISSING_EXECUTION", "EXECUTION_ID_INVALID"],
    ["TENANT_MISMATCH", "TENANT_ALIGNMENT_MISSING"],
    ["SCOPE_AMBIGUOUS", "SUPERVISION_SCOPE_AMBIGUOUS"],
    ["POLICIES_MISSING", "MONITORING_POLICIES_MISSING"],
    ["EXECUTION_CONTROL_GRANTED", "INTERVENTION_AUTHORITY_NOT_ADVISORY"],
    ["CONFIDENCE_MODEL_MISSING", "CONFIDENCE_MODEL_MISSING"],
    ["EVIDENCE_INCOMPLETE", "EVIDENCE_REQUIREMENTS_INCOMPLETE"],
    ["REPLAY_MISSING", "REPLAY_REFERENCE_MISSING"],
    ["LINEAGE_MISSING", "LINEAGE_REFERENCE_MISSING"],
    ["TRUTH_LEDGER_NOT_REQUIRED", "TRUTH_LEDGER_NOT_REQUIRED"],
    ["HIDDEN_STATE_ALLOWED", "HIDDEN_STATE_ALLOWED"],
    ["AUTONOMOUS_INTERVENTION_ALLOWED", "AUTONOMOUS_INTERVENTION_ALLOWED"],
    ["INVALID_TRANSITION", "INVALID_LIFECYCLE_TRANSITION"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
  ] as readonly [RuntimeSupervisionScenario, RuntimeSupervisionFailureReason][])("rejects scenario %s", (scenario, reason) => {
    const contract = buildRuntimeSupervisionContract({ scenario });
    const result = validateRuntimeSupervisionContract(contract, { registry: [contract] });

    expect(result.validation_state).toBe("FAIL");
    expect(result.failures).toContain(reason);
    expect(result.ready_for_runtime_supervision).toBe(false);
  });

  it("detects duplicate supervision identities", () => {
    const first = buildRuntimeSupervisionContract();
    const duplicate = buildRuntimeSupervisionContract();
    const result = validateRuntimeSupervisionContract(duplicate, { registry: [first, duplicate] });

    expect(result.failures).toContain("SUPERVISION_ID_DUPLICATE");
  });

  it("publishes framework doctrine and observability", () => {
    const framework = getRuntimeSupervisionContractFramework();
    const surface = buildRuntimeSupervisionObservabilitySurface(buildRuntimeSupervisionContract({ scenario: "EXECUTION_CONTROL_GRANTED" }));

    expect(framework.doctrine.supervision_version).toBe("runtime-supervision-contract/v8E.A");
    expect(framework.doctrine.principles).toContain("advisory-only");
    expect(framework.doctrine.lifecycle_states).toEqual(["DRAFT", "VALIDATING", "ACTIVE", "SUSPENDED", "SUPERSEDED", "ARCHIVED", "INVALID"]);
    expect(framework.validation.validation_state).toBe("PASS");
    expect(surface.validation_state).toBe("FAIL");
    expect(surface.failure_reasons).toContain("INTERVENTION_AUTHORITY_NOT_ADVISORY");
    expect(surface.integrity_status).toBe("VALID");
  });
});
