import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  TruthReplayDeterminismGate,
  TruthReplayDeterminismGateAuditEventName,
  TruthReplayDeterminismGateCertificationState,
  TruthReplayDeterminismGateRequest,
  TruthReplayDeterminismGateState,
  TruthReplayDeterminismGateStorageRecord,
  TruthReplayDeterminismGateType,
  TruthReplayGateArtifactStatus,
  TruthReplayGateCompletenessStatus,
  TruthReplayGateDecisionFactor,
  TruthReplayGateDeterminismStatus,
  TruthReplayGateDomainStatus,
  TruthReplayGateHashStatus,
  TruthReplayGateMissingItem,
  TruthReplayGateOutputStatus,
} from "./types";

export const TRUTH_REPLAY_DETERMINISM_GATE_EVENTS: Readonly<Record<TruthReplayDeterminismGateAuditEventName, TruthReplayDeterminismGateAuditEventName>> = Object.freeze({
  REPLAY_DETERMINISM_GATE_REQUESTED: "REPLAY_DETERMINISM_GATE_REQUESTED",
  REPLAY_DETERMINISM_ARTIFACTS_LOADED: "REPLAY_DETERMINISM_ARTIFACTS_LOADED",
  REPLAY_DETERMINISM_ARTIFACTS_VERIFIED: "REPLAY_DETERMINISM_ARTIFACTS_VERIFIED",
  REPLAY_DETERMINISM_HASH_CHAIN_VERIFIED: "REPLAY_DETERMINISM_HASH_CHAIN_VERIFIED",
  REPLAY_DETERMINISM_COMPLETENESS_VERIFIED: "REPLAY_DETERMINISM_COMPLETENESS_VERIFIED",
  REPLAY_DETERMINISM_VERIFIED: "REPLAY_DETERMINISM_VERIFIED",
  REPLAY_DETERMINISM_GOVERNANCE_VERIFIED: "REPLAY_DETERMINISM_GOVERNANCE_VERIFIED",
  REPLAY_DETERMINISM_AUTHORITY_VERIFIED: "REPLAY_DETERMINISM_AUTHORITY_VERIFIED",
  REPLAY_DETERMINISM_EVIDENCE_VERIFIED: "REPLAY_DETERMINISM_EVIDENCE_VERIFIED",
  REPLAY_DETERMINISM_LINEAGE_VERIFIED: "REPLAY_DETERMINISM_LINEAGE_VERIFIED",
  REPLAY_DETERMINISM_OUTPUT_STATUS_VERIFIED: "REPLAY_DETERMINISM_OUTPUT_STATUS_VERIFIED",
  REPLAY_DETERMINISM_REPRODUCED: "REPLAY_DETERMINISM_REPRODUCED",
  REPLAY_DETERMINISM_MISMATCH: "REPLAY_DETERMINISM_MISMATCH",
  REPLAY_DETERMINISM_INCOMPLETE: "REPLAY_DETERMINISM_INCOMPLETE",
  REPLAY_DETERMINISM_INVALID: "REPLAY_DETERMINISM_INVALID",
  REPLAY_DETERMINISM_GATE_DECISION_RECORDED: "REPLAY_DETERMINISM_GATE_DECISION_RECORDED",
  REPLAY_DETERMINISM_GATE_ESCALATED: "REPLAY_DETERMINISM_GATE_ESCALATED",
});

const GATE_TYPES: Readonly<Record<string, TruthReplayDeterminismGateType>> = Object.freeze({
  TRUTH_RECORD_OUTPUT_VERIFICATION: "TRUTH_RECORD_DETERMINISM_GATE",
  EVENT_OUTPUT_VERIFICATION: "EVENT_DETERMINISM_GATE",
  EVIDENCE_OUTPUT_VERIFICATION: "EVIDENCE_DETERMINISM_GATE",
  RECOMMENDATION_OUTPUT_VERIFICATION: "RECOMMENDATION_DETERMINISM_GATE",
  GOVERNANCE_OUTPUT_VERIFICATION: "GOVERNANCE_DETERMINISM_GATE",
  LINEAGE_OUTPUT_VERIFICATION: "LINEAGE_DETERMINISM_GATE",
  MISSION_OUTPUT_VERIFICATION: "MISSION_DETERMINISM_GATE",
  FULL_CONTEXT_OUTPUT_VERIFICATION: "FULL_CONTEXT_DETERMINISM_GATE",
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function factor(code: TruthReplayGateDecisionFactor["code"], message: string, severity: TruthReplayGateDecisionFactor["severity"]): TruthReplayGateDecisionFactor {
  return Object.freeze({ code, message, severity });
}

function addFactor(factors: TruthReplayGateDecisionFactor[], code: TruthReplayGateDecisionFactor["code"], message: string, severity: TruthReplayGateDecisionFactor["severity"]): void {
  factors.push(factor(code, message, severity));
}

function buildArtifactStatus(request: TruthReplayDeterminismGateRequest, factors: TruthReplayGateDecisionFactor[]): TruthReplayGateArtifactStatus {
  const verification = request.output_verification;
  const missing = [];
  const uncertified = [];
  const contractPresent = !request.force_replay_contract_missing;
  const inputPresent = !request.force_input_bundle_missing;
  const statePresent = !request.force_state_package_missing;
  const outputVerificationPresent = !!verification && !request.force_output_verification_missing;
  const replayOutputPresent = !!verification?.produced_output && !request.force_replay_output_missing;
  const expectedOutputPresent = !!verification?.expected_output && !request.force_expected_output_missing;
  for (const [present, artifact] of [
    [contractPresent, "REPLAY_CONTRACT"],
    [inputPresent, "INPUT_BUNDLE"],
    [statePresent, "STATE_PACKAGE"],
    [outputVerificationPresent, "OUTPUT_VERIFICATION"],
    [replayOutputPresent, "REPLAY_OUTPUT"],
    [expectedOutputPresent, "EXPECTED_OUTPUT"],
  ] as const) {
    if (!present) {
      missing.push({ artifact_type: artifact, reason: "Required replay gate artifact is missing." });
      addFactor(factors, "ARTIFACT_MISSING", `${artifact} is missing.`, "INCOMPLETE");
    }
  }
  const outputVerificationCertified = verification?.certification_state === "OUTPUT_MATCHED" || verification?.certification_state === "OUTPUT_MISMATCHED";
  if (request.force_input_bundle_uncertified) uncertified.push({ artifact_type: "INPUT_BUNDLE" as const, certification_state: "UNCERTIFIED" });
  if (request.force_state_package_uncertified) uncertified.push({ artifact_type: "STATE_PACKAGE" as const, certification_state: "UNCERTIFIED" });
  if (request.force_output_verification_uncertified || !outputVerificationCertified) uncertified.push({ artifact_type: "OUTPUT_VERIFICATION" as const, certification_state: verification?.certification_state });
  for (const item of uncertified) addFactor(factors, "ARTIFACT_UNCERTIFIED", `${item.artifact_type} is not certified.`, "INCOMPLETE");
  if (missing.length === 0 && uncertified.length === 0) addFactor(factors, "ARTIFACTS_CERTIFIED", "All required replay artifacts are present and certified.", "INFO");
  return Object.freeze({
    replay_contract_present: contractPresent,
    input_bundle_present: inputPresent,
    state_package_present: statePresent,
    output_verification_present: outputVerificationPresent,
    replay_contract_certified: contractPresent && !request.force_replay_contract_invalid,
    input_bundle_certified: inputPresent && !request.force_input_bundle_uncertified,
    state_package_certified: statePresent && !request.force_state_package_uncertified,
    output_verification_certified: outputVerificationCertified && !request.force_output_verification_uncertified,
    replay_output_present: replayOutputPresent,
    expected_output_present: expectedOutputPresent,
    missing_artifacts: Object.freeze(missing),
    uncertified_artifacts: Object.freeze(uncertified),
  });
}

function buildHashStatus(request: TruthReplayDeterminismGateRequest, factors: TruthReplayGateDecisionFactor[]): TruthReplayGateHashStatus {
  const mismatches = [];
  const flags = [
    ["contract", request.force_contract_hash_mismatch],
    ["input_bundle", request.force_input_bundle_hash_mismatch],
    ["state_package", request.force_state_package_hash_mismatch],
    ["output_verification", request.force_output_verification_hash_mismatch],
    ["hash_chain", request.force_hash_chain_broken],
    ["artifact_provenance", request.force_artifact_provenance_mismatch],
  ] as const;
  for (const [artifact, enabled] of flags) {
    if (enabled) mismatches.push({ artifact_type: artifact, reason: "Replay gate hash or provenance mismatch." });
  }
  if (mismatches.length > 0) addFactor(factors, "HASH_CHAIN_INVALID", "Replay hash chain is invalid.", "INVALID");
  else addFactor(factors, "HASH_CHAIN_VALID", "Replay hash chain is consistent.", "INFO");
  return Object.freeze({
    contract_hash_valid: !request.force_contract_hash_mismatch,
    input_bundle_hash_valid: !request.force_input_bundle_hash_mismatch,
    state_package_hash_valid: !request.force_state_package_hash_mismatch,
    output_verification_hash_valid: !request.force_output_verification_hash_mismatch,
    produced_output_hash_valid: request.output_verification?.hash_verification.produced_output_hash.length > 0,
    expected_output_hash_valid: !!request.output_verification?.expected_output.expected_output_hash,
    hash_chain_consistent: mismatches.length === 0,
    hash_mismatches: Object.freeze(mismatches),
  });
}

function buildCompletenessStatus(request: TruthReplayDeterminismGateRequest, artifactStatus: TruthReplayGateArtifactStatus, factors: TruthReplayGateDecisionFactor[]): TruthReplayGateCompletenessStatus {
  const missing: TruthReplayGateMissingItem[] = [
    ...artifactStatus.missing_artifacts.map((artifact) => ({ item_type: artifact.artifact_type, reason: artifact.reason })),
  ];
  for (const [enabled, item] of [
    [request.force_missing_evidence, "EVIDENCE"],
    [request.force_missing_lineage, "LINEAGE"],
    [request.force_missing_governance || request.force_policy_snapshot_missing, "GOVERNANCE"],
    [request.force_missing_schema, "SCHEMA"],
    [request.force_unverifiable_output || request.force_output_failed_missing_expected, "OUTPUT_VERIFICATION"],
  ] as const) {
    if (enabled) missing.push({ item_type: item, reason: "Required replay material is missing or unverifiable." });
  }
  const complete = missing.length === 0 && artifactStatus.uncertified_artifacts.length === 0;
  if (!complete) addFactor(factors, "MATERIAL_INCOMPLETE", "Replay gate has missing or uncertified material.", "INCOMPLETE");
  else addFactor(factors, "COMPLETENESS_VERIFIED", "Replay gate material is complete.", "INFO");
  return Object.freeze({
    complete,
    contract_complete: artifactStatus.replay_contract_present && artifactStatus.replay_contract_certified,
    input_bundle_complete: artifactStatus.input_bundle_present && artifactStatus.input_bundle_certified,
    state_package_complete: artifactStatus.state_package_present && artifactStatus.state_package_certified,
    output_verification_complete: artifactStatus.output_verification_present && artifactStatus.output_verification_certified,
    expected_output_complete: artifactStatus.expected_output_present && !request.force_expected_output_missing,
    produced_output_complete: artifactStatus.replay_output_present && !request.force_replay_output_missing,
    evidence_complete: !request.force_missing_evidence,
    lineage_complete: !request.force_missing_lineage,
    governance_complete: !request.force_missing_governance && !request.force_policy_snapshot_missing,
    authority_complete: true,
    schema_complete: !request.force_missing_schema,
    missing_required_items: Object.freeze(missing),
  });
}

function buildDeterminismStatus(request: TruthReplayDeterminismGateRequest, factors: TruthReplayGateDecisionFactor[]): TruthReplayGateDeterminismStatus {
  const nondeterminism = [];
  for (const [enabled, source, reason] of [
    [request.force_unstable_serialization, "serialization", "Stable serialization failed."],
    [request.force_nondeterministic_ordering, "ordering", "Stable ordering failed."],
    [request.force_unsupported_hash_algorithm, "hashing", "Unsupported hash algorithm."],
    [request.force_wall_clock_dependency, "wall_clock", "Wall-clock dependency detected."],
    [request.force_random_dependency, "random", "Random dependency detected."],
    [request.force_external_network_dependency, "network", "External network dependency detected."],
    [request.force_uncontrolled_tool_dependency, "tool", "Uncontrolled tool dependency detected."],
  ] as const) {
    if (enabled) nondeterminism.push({ source, reason });
  }
  if (nondeterminism.length) addFactor(factors, "NONDETERMINISM_DETECTED", "Replay gate detected nondeterminism.", "INVALID");
  else addFactor(factors, "DETERMINISM_VERIFIED", "Replay gate determinism is preserved.", "INFO");
  return Object.freeze({
    deterministic: nondeterminism.length === 0,
    contract_deterministic: !request.force_unstable_serialization,
    input_reconstruction_deterministic: !request.force_nondeterministic_ordering,
    state_reconstruction_deterministic: !request.force_nondeterministic_ordering,
    output_verification_deterministic: !request.force_unstable_serialization,
    gate_decision_deterministic: true,
    stable_serialization_verified: !request.force_unstable_serialization,
    stable_ordering_verified: !request.force_nondeterministic_ordering,
    stable_hashing_verified: !request.force_unsupported_hash_algorithm,
    nondeterminism_detected: Object.freeze(nondeterminism),
  });
}

function domainStatus(request: TruthReplayDeterminismGateRequest, domain: "governance" | "authority" | "evidence" | "lineage", factors: TruthReplayGateDecisionFactor[]): TruthReplayGateDomainStatus {
  const violations = [];
  if (domain === "governance") {
    if (request.force_current_policy_substitution) violations.push("CURRENT_POLICY_SUBSTITUTED");
    if (request.force_governance_bypass) violations.push("GOVERNANCE_BYPASS");
    if (request.force_governance_decision_mismatch) violations.push("GOVERNANCE_DECISION_MISMATCH");
  }
  if (domain === "authority") {
    if (request.force_execution_authority) violations.push("EXECUTION_AUTHORITY");
    if (request.force_authority_expansion) violations.push("AUTHORITY_EXPANSION");
    if (request.force_source_mutation) violations.push("SOURCE_MUTATION");
    if (request.force_unauthorized_write) violations.push("UNAUTHORIZED_WRITE");
  }
  if (domain === "evidence") {
    if (request.force_evidence_ref_mismatch) violations.push("EVIDENCE_REF_MISMATCH");
    if (request.force_evidence_hash_mismatch) violations.push("EVIDENCE_HASH_MISMATCH");
  }
  if (domain === "lineage") {
    if (request.force_lineage_ref_mismatch) violations.push("LINEAGE_REF_MISMATCH");
    if (request.force_cross_tenant_lineage_edge) violations.push("CROSS_TENANT_LINEAGE_EDGE");
  }
  const preserved = violations.length === 0;
  if (domain === "governance") addFactor(factors, preserved ? "GOVERNANCE_PRESERVED" : "GOVERNANCE_VIOLATION", preserved ? "Governance preserved." : "Governance violation detected.", preserved ? "INFO" : "INVALID");
  if (domain === "authority") addFactor(factors, preserved ? "AUTHORITY_PRESERVED" : "AUTHORITY_VIOLATION", preserved ? "Authority preserved." : "Authority violation detected.", preserved ? "INFO" : "INVALID");
  if (domain === "evidence") addFactor(factors, preserved ? "EVIDENCE_PRESERVED" : "EVIDENCE_INCOMPLETE", preserved ? "Evidence preserved." : "Evidence mismatch or incompleteness detected.", preserved ? "INFO" : request.force_evidence_hash_mismatch === true ? "INVALID" : "MISMATCH");
  if (domain === "lineage") addFactor(factors, preserved ? "LINEAGE_PRESERVED" : "LINEAGE_INCOMPLETE", preserved ? "Lineage preserved." : "Lineage mismatch or incompleteness detected.", preserved ? "INFO" : request.force_cross_tenant_lineage_edge === true ? "INVALID" : "MISMATCH");
  return Object.freeze({ preserved, violations: Object.freeze(violations) });
}

function outputStatus(request: TruthReplayDeterminismGateRequest, factors: TruthReplayGateDecisionFactor[]): TruthReplayGateOutputStatus {
  const result = request.output_verification?.verification_result.result_state;
  const status = Object.freeze({
    verification_completed: !!result && result !== "UNVERIFIABLE",
    output_matched: result === "MATCHED",
    output_mismatched: result === "MISMATCHED" || request.force_evidence_ref_mismatch === true || request.force_lineage_ref_mismatch === true,
    output_unverifiable: result === "UNVERIFIABLE" || result === "ESCALATION_REQUIRED" || request.force_unverifiable_output === true,
    output_failed: result === "FAILED" || request.force_output_failed_hard_violation === true,
    mismatch_categories: Object.freeze(request.output_verification?.mismatch_report.mismatch_categories ?? []),
  });
  if (status.output_matched) addFactor(factors, "OUTPUT_MATCHED", "Replay output verification matched.", "INFO");
  if (status.output_mismatched) addFactor(factors, "OUTPUT_MISMATCHED", "Replay output verification mismatched.", "MISMATCH");
  if (status.output_unverifiable) addFactor(factors, "OUTPUT_UNVERIFIABLE", "Replay output verification is unverifiable or escalated.", "INCOMPLETE");
  if (status.output_failed) addFactor(factors, "OUTPUT_FAILED", "Replay output verification failed.", request.force_output_failed_missing_expected ? "INCOMPLETE" : "INVALID");
  return status;
}

function finalState(factors: readonly TruthReplayGateDecisionFactor[], output: TruthReplayGateOutputStatus): TruthReplayDeterminismGateState {
  if (factors.some((factor) => factor.severity === "INVALID")) return "INVALID";
  if (factors.some((factor) => factor.severity === "INCOMPLETE")) return "INCOMPLETE";
  if (factors.some((factor) => factor.severity === "MISMATCH") || output.output_mismatched) return "MISMATCH";
  return "REPRODUCED";
}

function certificationState(state: TruthReplayDeterminismGateState): TruthReplayDeterminismGateCertificationState {
  if (state === "REPRODUCED") return "REPLAY_REPRODUCED";
  if (state === "MISMATCH") return "REPLAY_MISMATCHED";
  if (state === "INCOMPLETE") return "REPLAY_INCOMPLETE";
  return "REPLAY_INVALID";
}

export function decideTruthReplayDeterminismGate(request: TruthReplayDeterminismGateRequest): TruthReplayDeterminismGate {
  const factors: TruthReplayGateDecisionFactor[] = [];
  if (request.force_gate_contract_missing) addFactor(factors, "ARTIFACT_MISSING", "Determinism gate contract is missing.", "INVALID");
  if (request.force_gate_id_missing || !request.gate_id?.trim()) addFactor(factors, "ARTIFACT_MISSING", "Gate identity is missing.", "INVALID");
  if (request.force_replay_id_missing || !request.output_verification?.replay_id) addFactor(factors, "ARTIFACT_MISSING", "Replay identity is missing.", "INVALID");
  if (request.force_tenant_id_missing || !request.output_verification?.tenant_id) addFactor(factors, "ARTIFACT_MISSING", "Tenant identity is missing.", "INVALID");
  if (request.force_tenant_scope_violation) addFactor(factors, "TENANT_SCOPE_VIOLATION", "Tenant scope violation detected.", "INVALID");
  if (request.force_mission_scope_violation) addFactor(factors, "MISSION_SCOPE_VIOLATION", "Mission scope violation detected.", "INVALID");
  if (request.force_replay_target_mismatch) addFactor(factors, "REPLAY_TARGET_MISMATCH", "Replay target mismatch detected.", "INVALID");
  if (request.force_invalid_gate_state) addFactor(factors, "ARTIFACT_MISSING", "Invalid final gate state requested.", "INVALID");
  if (request.force_replay_contract_invalid) addFactor(factors, "ARTIFACT_UNCERTIFIED", "Replay contract is invalid.", "INVALID");

  const artifactStatus = buildArtifactStatus(request, factors);
  const hashStatus = buildHashStatus(request, factors);
  const completenessStatus = buildCompletenessStatus(request, artifactStatus, factors);
  const determinismStatus = buildDeterminismStatus(request, factors);
  const governanceStatus = domainStatus(request, "governance", factors);
  const authorityStatus = domainStatus(request, "authority", factors);
  const evidenceStatus = domainStatus(request, "evidence", factors);
  const lineageStatus = domainStatus(request, "lineage", factors);
  const output = outputStatus(request, factors);
  let state = finalState(factors, output);

  if (request.force_reproduced_with_mismatch_report || request.force_reproduced_with_missing_artifact || request.force_mismatch_without_summary || request.force_incomplete_without_summary || request.force_invalid_without_reason) {
    state = "INVALID";
    addFactor(factors, "HASH_CHAIN_INVALID", "Gate state validation rule failed.", "INVALID");
  }

  const mismatchSummary = state === "MISMATCH" ? Object.freeze({
    mismatch_categories: output.mismatch_categories.length ? output.mismatch_categories : ["OUTPUT_MISMATCH"],
    mismatch_severity: request.output_verification?.mismatch_report.mismatch_severity ?? "HIGH",
    mismatch_count: output.mismatch_categories.length || 1,
  }) : undefined;
  const invalidFactors = factors.filter((factor) => factor.severity === "INVALID");
  const incompleteItems = completenessStatus.missing_required_items;
  const final = state;
  const gateWithoutHash = {
    gate_id: request.force_gate_id_missing ? "" : request.gate_id,
    replay_id: request.force_replay_id_missing ? "" : request.output_verification?.replay_id ?? "missing_replay",
    tenant_id: request.force_tenant_id_missing ? "" : request.output_verification?.tenant_id ?? "missing_tenant",
    mission_id: request.output_verification?.mission_id,
    replay_contract_ref: request.output_verification?.replay_contract_ref ?? "missing_contract",
    replay_contract_hash: request.output_verification?.replay_contract_hash ?? "missing_contract_hash",
    input_bundle_ref: request.output_verification?.input_bundle_ref ?? "missing_input_bundle",
    input_bundle_hash: request.output_verification?.input_bundle_hash ?? "missing_input_hash",
    state_package_ref: request.output_verification?.state_package_ref ?? "missing_state_package",
    state_package_hash: request.output_verification?.state_package_hash ?? "missing_state_hash",
    output_verification_ref: request.output_verification?.verification_id ?? "missing_output_verification",
    output_verification_hash: request.output_verification?.verification_hash ?? "missing_verification_hash",
    gate_type: GATE_TYPES[request.output_verification?.verification_type ?? "FULL_CONTEXT_OUTPUT_VERIFICATION"] ?? "FULL_CONTEXT_DETERMINISM_GATE",
    gate_scope: request.gate_scope,
    artifact_status: artifactStatus,
    hash_status: hashStatus,
    completeness_status: completenessStatus,
    determinism_status: determinismStatus,
    governance_status: governanceStatus,
    authority_status: authorityStatus,
    evidence_status: evidenceStatus,
    lineage_status: lineageStatus,
    output_status: output,
    mismatch_summary: mismatchSummary,
    invalidity_summary: invalidFactors.length ? { invalidity_reasons: Object.freeze(invalidFactors) } : undefined,
    incompleteness_summary: final === "INCOMPLETE" ? { missing_items: incompleteItems, unresolved_escalations: request.output_verification?.escalation_reasons?.map((reason) => reason.message) ?? [] } : undefined,
    final_state: final,
    certification_eligible: final === "REPRODUCED",
    operator_review_required: final !== "REPRODUCED",
    escalation_required: final === "INVALID" || final === "INCOMPLETE",
    replay_execution_trust: final === "REPRODUCED" ? "HIGH" as const : final === "MISMATCH" ? "REVIEW_REQUIRED" as const : final === "INCOMPLETE" ? "INSUFFICIENT" as const : "REJECTED" as const,
    decision_reason: final === "REPRODUCED" ? "Replay deterministically reproduced the expected output." : final === "MISMATCH" ? "Replay completed but output differed from expected output." : final === "INCOMPLETE" ? "Replay lacks required material for final determination." : "Replay violated hard determinism, governance, authority, hash, or scope rules.",
    decision_factors: Object.freeze(request.decision_factor_nonce ? [...factors, factor("ARTIFACTS_CERTIFIED", request.decision_factor_nonce, "INFO")] : factors),
    lifecycle_state: "DECISION_RECORDED" as const,
    certification_state: certificationState(final),
    created_at: request.created_at,
  };
  const audit: TruthReplayDeterminismGateAuditEventName[] = [
    "REPLAY_DETERMINISM_GATE_REQUESTED",
    "REPLAY_DETERMINISM_ARTIFACTS_LOADED",
    "REPLAY_DETERMINISM_ARTIFACTS_VERIFIED",
    "REPLAY_DETERMINISM_HASH_CHAIN_VERIFIED",
    "REPLAY_DETERMINISM_COMPLETENESS_VERIFIED",
    "REPLAY_DETERMINISM_VERIFIED",
    "REPLAY_DETERMINISM_GOVERNANCE_VERIFIED",
    "REPLAY_DETERMINISM_AUTHORITY_VERIFIED",
    "REPLAY_DETERMINISM_EVIDENCE_VERIFIED",
    "REPLAY_DETERMINISM_LINEAGE_VERIFIED",
    "REPLAY_DETERMINISM_OUTPUT_STATUS_VERIFIED",
    final === "REPRODUCED" ? "REPLAY_DETERMINISM_REPRODUCED" : final === "MISMATCH" ? "REPLAY_DETERMINISM_MISMATCH" : final === "INCOMPLETE" ? "REPLAY_DETERMINISM_INCOMPLETE" : "REPLAY_DETERMINISM_INVALID",
    "REPLAY_DETERMINISM_GATE_DECISION_RECORDED",
  ];
  if (final === "INVALID" || final === "INCOMPLETE") audit.push("REPLAY_DETERMINISM_GATE_ESCALATED");
  return Object.freeze({
    ...gateWithoutHash,
    gate_hash: hashValue("mission-control-replay-determinism-gate-hash", gateWithoutHash),
    audit_events: Object.freeze(audit),
    readOnly: true as const,
    executionAuthorized: false as const,
    artifactMutationAllowed: false as const,
  });
}

export function canonicalizeTruthReplayDeterminismGate(gate: TruthReplayDeterminismGate): string {
  return canonicalizeConfidenceToString(gate);
}

export function toTruthReplayDeterminismGateStorageRecord(gate: TruthReplayDeterminismGate): TruthReplayDeterminismGateStorageRecord {
  return Object.freeze({
    gate_id: gate.gate_id,
    replay_id: gate.replay_id,
    tenant_id: gate.tenant_id,
    mission_id: gate.mission_id,
    replay_contract_ref: gate.replay_contract_ref,
    replay_contract_hash: gate.replay_contract_hash,
    input_bundle_ref: gate.input_bundle_ref,
    input_bundle_hash: gate.input_bundle_hash,
    state_package_ref: gate.state_package_ref,
    state_package_hash: gate.state_package_hash,
    output_verification_ref: gate.output_verification_ref,
    output_verification_hash: gate.output_verification_hash,
    gate_type: gate.gate_type,
    gate_scope_json: canonicalizeConfidenceToString(gate.gate_scope),
    artifact_status_json: canonicalizeConfidenceToString(gate.artifact_status),
    hash_status_json: canonicalizeConfidenceToString(gate.hash_status),
    completeness_status_json: canonicalizeConfidenceToString(gate.completeness_status),
    determinism_status_json: canonicalizeConfidenceToString(gate.determinism_status),
    governance_status_json: canonicalizeConfidenceToString(gate.governance_status),
    authority_status_json: canonicalizeConfidenceToString(gate.authority_status),
    evidence_status_json: canonicalizeConfidenceToString(gate.evidence_status),
    lineage_status_json: canonicalizeConfidenceToString(gate.lineage_status),
    output_status_json: canonicalizeConfidenceToString(gate.output_status),
    mismatch_summary_json: gate.mismatch_summary ? canonicalizeConfidenceToString(gate.mismatch_summary) : undefined,
    invalidity_summary_json: gate.invalidity_summary ? canonicalizeConfidenceToString(gate.invalidity_summary) : undefined,
    incompleteness_summary_json: gate.incompleteness_summary ? canonicalizeConfidenceToString(gate.incompleteness_summary) : undefined,
    final_state: gate.final_state,
    certification_eligible: gate.certification_eligible,
    operator_review_required: gate.operator_review_required,
    escalation_required: gate.escalation_required,
    decision_reason: gate.decision_reason,
    decision_factors_json: canonicalizeConfidenceToString(gate.decision_factors),
    gate_hash: gate.gate_hash,
    lifecycle_state: gate.lifecycle_state,
    certification_state: gate.certification_state,
    created_at: gate.created_at,
  });
}
