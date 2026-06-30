import { describe, expect, it } from "vitest";
import {
  buildPolicyAnalysisDoctrine,
  buildPolicyAnalysisObservabilitySurface,
  buildPolicyAnalysisRecord,
  computePolicyAnalysisHash,
  replayPolicyAnalysis,
  transitionPolicyAnalysisState,
  validatePolicyAnalysisRecord,
} from "@/services/policy-analysis";
import type { PolicyAnalysisRecord } from "@/types/policy-analysis";

function valid(overrides: Partial<PolicyAnalysisRecord> = {}) {
  return buildPolicyAnalysisRecord(overrides);
}

function invalid(overrides: Partial<PolicyAnalysisRecord>) {
  return validatePolicyAnalysisRecord({ ...valid(), ...overrides });
}

describe("Mission Control Phase 7B.1 Policy Analysis Contract", () => {
  it("defines policy analysis doctrine", () => {
    const doctrine = buildPolicyAnalysisDoctrine();
    expect(doctrine.principles).toContain("deterministic");
    expect(doctrine.principles).toContain("truth-ledger-compatible");
    expect(doctrine.prohibited_behaviors).toContain("autonomous policy enforcement");
    expect(doctrine.supported_policy_types).toContain("RUNTIME_POLICY");
  });

  it("builds a valid PolicyAnalysis contract", () => {
    const record = valid();
    expect(record.schema_version).toBe("policy-analysis-contract/v7B.1");
    expect(record.policy_analysis_id).toBe("pa_tenant_alpha_policy_runtime_000145");
    expect(record.analysis_hash).toBeTruthy();
  });

  it("validates a complete contract", () => {
    const result = validatePolicyAnalysisRecord(valid());
    expect(result.validation_state).toBe("PASS");
    expect(result.failures).toEqual([]);
    expect(result.advisory_only).toBe(true);
    expect(result.replayable).toBe(true);
  });

  it("requires identity fields", () => {
    expect(invalid({ policy_analysis_id: "" }).failures.some((failure) => failure.reason === "POLICY_ANALYSIS_ID_MISSING")).toBe(true);
    expect(invalid({ policy_id: "" }).failures.some((failure) => failure.reason === "POLICY_ID_MISSING")).toBe(true);
    expect(invalid({ tenant_id: "" }).failures.some((failure) => failure.reason === "TENANT_ID_MISSING")).toBe(true);
    expect(invalid({ policy_version: "" }).failures.some((failure) => failure.reason === "POLICY_VERSION_MISSING")).toBe(true);
  });

  it("accepts supported policy types and rejects unknown types", () => {
    expect(validatePolicyAnalysisRecord(valid({ policy_type: "SECURITY_POLICY" })).validation_state).toBe("PASS");
    expect(invalid({ policy_type: "UNKNOWN_POLICY" as never }).failures.some((failure) => failure.reason === "UNKNOWN_POLICY_TYPE")).toBe(true);
  });

  it("requires authority and governance scope", () => {
    expect(validatePolicyAnalysisRecord({ ...valid(), authority_scope: undefined }).failures.some((failure) => failure.reason === "AUTHORITY_SCOPE_MISSING")).toBe(true);
    expect(validatePolicyAnalysisRecord({ ...valid(), governance_scope: undefined }).failures.some((failure) => failure.reason === "GOVERNANCE_SCOPE_MISSING")).toBe(true);
  });

  it("requires constraints and enforcement boundaries", () => {
    expect(invalid({ constraints: [] }).failures.some((failure) => failure.reason === "CONSTRAINTS_MISSING")).toBe(true);
    expect(validatePolicyAnalysisRecord({ ...valid(), enforcement_boundaries: undefined }).failures.some((failure) => failure.reason === "ENFORCEMENT_BOUNDARIES_MISSING")).toBe(true);
  });

  it("requires explicit exceptions", () => {
    const record = valid({ exceptions: [{ ...valid().exceptions[0], exception_id: "hidden_exception_001" }] });
    expect(validatePolicyAnalysisRecord(record).failures.some((failure) => failure.reason === "EXCEPTION_INVALID")).toBe(true);
  });

  it("rejects unscoped permissions and prohibitions", () => {
    expect(invalid({ permissions: [{ ...valid().permissions[0], scope: "" }] }).failures.some((failure) => failure.reason === "PERMISSION_UNSCOPED")).toBe(true);
    expect(invalid({ prohibitions: [{ ...valid().prohibitions[0], scope: "" }] }).failures.some((failure) => failure.reason === "PROHIBITION_UNSCOPED")).toBe(true);
  });

  it("detects prohibition bypass", () => {
    const record = valid({ permissions: [{ permission_id: "permission_execute", behavior: "execute runtime action", scope: "tenant_alpha", authority_ref: "Operator" }] });
    expect(validatePolicyAnalysisRecord(record).failures.some((failure) => failure.reason === "PROHIBITION_BYPASS_DETECTED")).toBe(true);
  });

  it("requires Truth Ledger references and tenant compatibility", () => {
    expect(invalid({ source_truth_records: [] }).failures.some((failure) => failure.reason === "SOURCE_TRUTH_RECORDS_MISSING")).toBe(true);
    const record = valid({ source_truth_records: [{ ...valid().source_truth_records[0], tenant_id: "tenant_beta" }] });
    expect(validatePolicyAnalysisRecord(record).failures.some((failure) => failure.reason === "TRUTH_TENANT_MISMATCH")).toBe(true);
  });

  it("requires lineage and detects lineage breaks", () => {
    expect(validatePolicyAnalysisRecord({ ...valid(), lineage_refs: undefined }).failures.some((failure) => failure.reason === "LINEAGE_REFS_MISSING")).toBe(true);
    expect(invalid({ lineage_refs: { ...valid().lineage_refs, dependency_refs: ["broken_lineage"] } }).failures.some((failure) => failure.reason === "LINEAGE_BREAK_DETECTED")).toBe(true);
  });

  it("requires replay references and detects replay mismatch", () => {
    expect(validatePolicyAnalysisRecord({ ...valid(), replay_refs: undefined }).failures.some((failure) => failure.reason === "REPLAY_REFS_MISSING")).toBe(true);
    expect(invalid({ replay_refs: { ...valid().replay_refs, output_hash: "mismatch" } }).failures.some((failure) => failure.reason === "REPLAY_OUTPUT_MISMATCH")).toBe(true);
  });

  it("detects identifier mutation", () => {
    const record = valid();
    const mutated = { ...record, policy_analysis_id: "pa_mutated" };
    expect(validatePolicyAnalysisRecord(mutated, { original_record: record }).failures.some((failure) => failure.reason === "IDENTIFIER_MUTATION")).toBe(true);
  });

  it("detects circular inheritance", () => {
    const record = valid({ inheritance: { ...valid().inheritance, inherits_from: [valid().policy_id] } });
    expect(validatePolicyAnalysisRecord(record).failures.some((failure) => failure.reason === "CIRCULAR_INHERITANCE")).toBe(true);
  });

  it("transitions valid states and blocks invalid transitions", () => {
    expect(transitionPolicyAnalysisState(valid(), "VALIDATED").validation_state).toBe("PASS");
    expect(transitionPolicyAnalysisState(valid(), "ARCHIVED").failures.some((failure) => failure.reason === "INVALID_STATE_TRANSITION")).toBe(true);
  });

  it("replays the same policy analysis", () => {
    const record = valid();
    const replay = replayPolicyAnalysis(record);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.reconstructed_hash).toBe(record.analysis_hash);
  });

  it("produces reproducible hashes and detects hash tampering", () => {
    expect(computePolicyAnalysisHash(valid())).toBe(computePolicyAnalysisHash(valid()));
    expect(validatePolicyAnalysisRecord({ ...valid(), analysis_hash: "tampered" }).failures.some((failure) => failure.reason === "REPLAY_OUTPUT_MISMATCH")).toBe(true);
  });

  it("builds operator observability surface", () => {
    const record = valid();
    const surface = buildPolicyAnalysisObservabilitySurface(record);
    expect(surface.policy_id).toBe(record.policy_id);
    expect(surface.governing_authority).toBe("Constitution Engine");
    expect(surface.source_truth_records).toEqual(record.source_truth_records);
    expect(surface.validation_failures).toEqual([]);
  });
});
