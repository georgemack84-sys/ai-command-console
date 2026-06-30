import { describe, expect, it } from "vitest";
import {
  buildExecutionAssuranceObservabilitySurface,
  buildExecutionAssuranceRecord,
  computeExecutionAssuranceIntegrityHash,
  getExecutionAssuranceContractFramework,
  getExecutionAssuranceVersionPolicy,
  replayExecutionAssuranceRecord,
  validateExecutionAssuranceRecord,
} from "@/services/execution-assurance-contract";
import type { ExecutionAssuranceFailureReason, ExecutionAssuranceScenario } from "@/types/execution-assurance-contract";

describe("Mission Control Phase 8E.1 Execution Assurance Contract", () => {
  it("builds an immutable execution assurance record with canonical schema fields", () => {
    const record = buildExecutionAssuranceRecord();

    expect(Object.isFrozen(record)).toBe(true);
    expect(record.assurance_version).toBe("execution-assurance-contract/v8E.1");
    expect(record.schema_version).toBe("execution-assurance-schema/v8E.1");
    expect(record.assurance_id).toMatch(/^EA-/);
    expect(record.tenant_id).toBeTruthy();
    expect(record.execution_id).toBeTruthy();
    expect(record.assurance_state).toBe("MONITORING");
    expect(record.runtime_contract.advisory_only).toBe(true);
    expect(record.runtime_contract.execution_modified).toBe(false);
  });

  it("validates the baseline assurance record", () => {
    const record = buildExecutionAssuranceRecord();
    const result = validateExecutionAssuranceRecord(record, { registry: [record] });

    expect(result.validation_state).toBe("PASS");
    expect(result.failures).toEqual([]);
    expect(result.identity_valid).toBe(true);
    expect(result.schema_valid).toBe(true);
    expect(result.governance_valid).toBe(true);
    expect(result.runtime_valid).toBe(true);
    expect(result.ready_for_runtime_assurance).toBe(true);
  });

  it("produces deterministic integrity hashes and replay reconstruction", () => {
    const first = buildExecutionAssuranceRecord();
    const second = buildExecutionAssuranceRecord();
    const replay = replayExecutionAssuranceRecord(first);

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(computeExecutionAssuranceIntegrityHash(first)).toBe(first.integrity_hash);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.reconstructed_state_order).toEqual(["CREATED", "INITIALIZING", "VALIDATING", "ANALYZING", "ASSESSING", "HEALTHY", "MONITORING"]);
    expect(replay.reconstructed_recommended_action).toBe("CONTINUE_MONITORING");
  });

  it.each([
    ["MISSING_REQUIRED_FIELD", "REQUIRED_FIELD_MISSING"],
    ["TENANT_MISMATCH", "TENANT_OWNERSHIP_INVALID"],
    ["MISSION_MISMATCH", "MISSION_OWNERSHIP_INVALID"],
    ["UNSUPPORTED_VERSION", "UNSUPPORTED_SCHEMA_VERSION"],
    ["INVALID_TRANSITION", "INVALID_STATE_TRANSITION"],
    ["GOVERNANCE_INVALID", "GOVERNANCE_INVALID"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION"],
    ["AUTHORITY_INVALID", "AUTHORITY_INVALID"],
    ["RUNTIME_INVALID", "RUNTIME_INPUT_INVALID"],
    ["REPLAY_MISSING", "REPLAY_METADATA_INCOMPLETE"],
    ["LINEAGE_BROKEN", "LINEAGE_INCOMPLETE"],
    ["EVIDENCE_MISSING", "EVIDENCE_INCOMPLETE"],
    ["NOT_ADVISORY", "ASSURANCE_NOT_ADVISORY"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
  ] as readonly [ExecutionAssuranceScenario, ExecutionAssuranceFailureReason][])("rejects scenario %s", (scenario, reason) => {
    const record = buildExecutionAssuranceRecord({ scenario });
    const result = validateExecutionAssuranceRecord(record, { registry: [record] });

    expect(result.validation_state).toBe("FAIL");
    expect(result.failures).toContain(reason);
    expect(result.ready_for_runtime_assurance).toBe(false);
  });

  it("detects duplicate assurance identities", () => {
    const parent = buildExecutionAssuranceRecord();
    const duplicate = buildExecutionAssuranceRecord({ scenario: "DUPLICATE_ID", parent_assurance: parent });
    const result = validateExecutionAssuranceRecord(duplicate, { registry: [parent, duplicate] });

    expect(result.failures).toContain("DUPLICATE_ASSURANCE_ID");
  });

  it("detects immutable identity mutations", () => {
    const record = buildExecutionAssuranceRecord();
    const mutated = { ...record, execution_id: "execution:mutated" };
    const result = validateExecutionAssuranceRecord(mutated, { original_record: record, registry: [mutated] });

    expect(result.failures).toContain("IMMUTABLE_FIELD_MUTATION");
  });

  it("publishes version policy and framework doctrine", () => {
    const policy = getExecutionAssuranceVersionPolicy();
    const framework = getExecutionAssuranceContractFramework();

    expect(policy.current_assurance_version).toBe("execution-assurance-contract/v8E.1");
    expect(policy.deterministic_compatibility_required).toBe(true);
    expect(framework.doctrine.principles).toContain("advisory-only");
    expect(framework.validation.validation_state).toBe("PASS");
  });

  it("exposes observability", () => {
    const record = buildExecutionAssuranceRecord({ scenario: "RUNTIME_INVALID" });
    const surface = buildExecutionAssuranceObservabilitySurface(record);

    expect(surface.validation_state).toBe("FAIL");
    expect(surface.runtime_health).toBe("CRITICAL");
    expect(surface.recommended_action).toBe("RECOMMEND_ESCALATION");
    expect(surface.failure_reasons).toContain("RUNTIME_INPUT_INVALID");
    expect(surface.integrity_status).toBe("VALID");
  });
});
