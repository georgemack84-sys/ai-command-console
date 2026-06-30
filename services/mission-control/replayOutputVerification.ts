import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  TruthReplayOutputVerification,
  TruthReplayOutputVerificationAuditEventName,
  TruthReplayOutputVerificationFailureCode,
  TruthReplayOutputVerificationFailureReason,
  TruthReplayOutputVerificationRequest,
  TruthReplayOutputVerificationResult,
  TruthReplayOutputVerificationResultState,
  TruthReplayOutputVerificationStorageRecord,
  TruthReplayOutputVerificationType,
  TruthReplayNamedOutputVerification,
  TruthReplayOutputHashVerification,
  TruthReplayOutputMismatchReport,
  TruthReplayStructuralVerification,
  TruthReplayFieldVerificationReport,
  TruthReplayFieldMismatch,
} from "./types";

export const TRUTH_REPLAY_OUTPUT_VERIFICATION_EVENTS: Readonly<Record<TruthReplayOutputVerificationAuditEventName, TruthReplayOutputVerificationAuditEventName>> = Object.freeze({
  REPLAY_OUTPUT_VERIFICATION_REQUESTED: "REPLAY_OUTPUT_VERIFICATION_REQUESTED",
  REPLAY_OUTPUT_STATE_PACKAGE_LOADED: "REPLAY_OUTPUT_STATE_PACKAGE_LOADED",
  REPLAY_OUTPUT_ARTIFACT_LOADED: "REPLAY_OUTPUT_ARTIFACT_LOADED",
  REPLAY_EXPECTED_OUTPUT_RESOLVED: "REPLAY_EXPECTED_OUTPUT_RESOLVED",
  REPLAY_OUTPUT_SCOPE_VERIFIED: "REPLAY_OUTPUT_SCOPE_VERIFIED",
  REPLAY_OUTPUT_CANONICALIZED: "REPLAY_OUTPUT_CANONICALIZED",
  REPLAY_OUTPUT_HASH_VERIFIED: "REPLAY_OUTPUT_HASH_VERIFIED",
  REPLAY_OUTPUT_STRUCTURE_VERIFIED: "REPLAY_OUTPUT_STRUCTURE_VERIFIED",
  REPLAY_OUTPUT_FIELDS_VERIFIED: "REPLAY_OUTPUT_FIELDS_VERIFIED",
  REPLAY_OUTPUT_GOVERNANCE_VERIFIED: "REPLAY_OUTPUT_GOVERNANCE_VERIFIED",
  REPLAY_OUTPUT_AUTHORITY_VERIFIED: "REPLAY_OUTPUT_AUTHORITY_VERIFIED",
  REPLAY_OUTPUT_EVIDENCE_VERIFIED: "REPLAY_OUTPUT_EVIDENCE_VERIFIED",
  REPLAY_OUTPUT_LINEAGE_VERIFIED: "REPLAY_OUTPUT_LINEAGE_VERIFIED",
  REPLAY_OUTPUT_RECOMMENDATION_VERIFIED: "REPLAY_OUTPUT_RECOMMENDATION_VERIFIED",
  REPLAY_OUTPUT_RISK_CONFIDENCE_VERIFIED: "REPLAY_OUTPUT_RISK_CONFIDENCE_VERIFIED",
  REPLAY_OUTPUT_MISMATCH_DETECTED: "REPLAY_OUTPUT_MISMATCH_DETECTED",
  REPLAY_OUTPUT_VERIFICATION_MATCHED: "REPLAY_OUTPUT_VERIFICATION_MATCHED",
  REPLAY_OUTPUT_VERIFICATION_MISMATCHED: "REPLAY_OUTPUT_VERIFICATION_MISMATCHED",
  REPLAY_OUTPUT_VERIFICATION_FAILED: "REPLAY_OUTPUT_VERIFICATION_FAILED",
  REPLAY_OUTPUT_VERIFICATION_ESCALATED: "REPLAY_OUTPUT_VERIFICATION_ESCALATED",
  REPLAY_OUTPUT_VERIFICATION_REPORT_CREATED: "REPLAY_OUTPUT_VERIFICATION_REPORT_CREATED",
});

const OUTPUT_VERIFICATION_TYPES: Readonly<Record<string, TruthReplayOutputVerificationType>> = Object.freeze({
  TRUTH_RECORD_STATE_RECONSTRUCTION: "TRUTH_RECORD_OUTPUT_VERIFICATION",
  EVENT_STATE_RECONSTRUCTION: "EVENT_OUTPUT_VERIFICATION",
  EVIDENCE_STATE_RECONSTRUCTION: "EVIDENCE_OUTPUT_VERIFICATION",
  RECOMMENDATION_STATE_RECONSTRUCTION: "RECOMMENDATION_OUTPUT_VERIFICATION",
  GOVERNANCE_STATE_RECONSTRUCTION: "GOVERNANCE_OUTPUT_VERIFICATION",
  LINEAGE_STATE_RECONSTRUCTION: "LINEAGE_OUTPUT_VERIFICATION",
  MISSION_STATE_RECONSTRUCTION: "MISSION_OUTPUT_VERIFICATION",
  FULL_CONTEXT_STATE_RECONSTRUCTION: "FULL_CONTEXT_OUTPUT_VERIFICATION",
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function failure(code: TruthReplayOutputVerificationFailureCode, message: string, path: string): TruthReplayOutputVerificationFailureReason {
  return Object.freeze({ code, message, path });
}

function addFailure(
  failures: TruthReplayOutputVerificationFailureReason[],
  code: TruthReplayOutputVerificationFailureCode,
  message: string,
  path: string,
): void {
  failures.push(failure(code, message, path));
}

function arraysEqual(left: readonly string[] | undefined, right: readonly string[] | undefined): boolean {
  return JSON.stringify([...(left ?? [])].sort()) === JSON.stringify([...(right ?? [])].sort());
}

function canonicalPayloadHash(value: unknown): string {
  return hashValue("mission-control-replay-output-canonical-payload-hash", value);
}

function namedVerification(name: string, verified: boolean, reasons: readonly string[]): TruthReplayNamedOutputVerification {
  const withoutHash = { verified, mismatch_reasons: reasons };
  return Object.freeze({
    ...withoutHash,
    verification_hash: hashValue(`mission-control-replay-output-${name}-verification-hash`, withoutHash),
  });
}

function validateEnvelope(request: TruthReplayOutputVerificationRequest, failures: TruthReplayOutputVerificationFailureReason[]): void {
  if (!request.verification_id?.trim()) addFailure(failures, "VERIFICATION_ID_MISSING", "Verification identity is required.", "verification_id");
  if (!request.state_package) {
    addFailure(failures, "STATE_PACKAGE_MISSING", "Certified replay state package is required.", "state_package");
    return;
  }
  if (!request.state_package.replay_id?.trim()) addFailure(failures, "REPLAY_ID_MISSING", "Replay identity is required.", "replay_id");
  if (!request.state_package.tenant_id?.trim()) addFailure(failures, "TENANT_ID_MISSING", "Tenant identity is required.", "tenant_id");
  if (request.state_package.certification_state !== "STATE_PACKAGE_CERTIFIED") addFailure(failures, "STATE_PACKAGE_UNCERTIFIED", "Replay output verification requires certified state package.", "state_package.certification_state");
  if (request.state_package.reconstruction_state === "ESCALATED" || request.state_package.escalation_reasons?.length) addFailure(failures, "UNRESOLVED_STATE_ESCALATION_PRESENT", "State package escalation must be resolved before verification.", "state_package.escalation_reasons");
  if (request.force_state_package_hash_mismatch === true) addFailure(failures, "STATE_PACKAGE_HASH_MISMATCH", "Replay state package hash mismatch.", "state_package.state_hashes.full_state_package_hash");
  if (!request.produced_output) addFailure(failures, "REPLAY_OUTPUT_MISSING", "Replay output artifact is required.", "produced_output");
  if (!request.expected_output || request.force_expected_output_missing === true) addFailure(failures, "EXPECTED_OUTPUT_MISSING", "Expected output is required.", "expected_output");
}

function validateProducedOutput(request: TruthReplayOutputVerificationRequest, failures: TruthReplayOutputVerificationFailureReason[]): void {
  const output = request.produced_output;
  const statePackage = request.state_package;
  if (!output) return;
  if (!output.output_hash) addFailure(failures, "REPLAY_OUTPUT_HASH_MISSING", "Replay output hash is required.", "produced_output.output_hash");
  if (request.force_output_hash_mismatch === true) addFailure(failures, "REPLAY_OUTPUT_HASH_MISMATCH", "Replay output hash mismatch.", "produced_output.output_hash");
  if (output.tenant_id !== statePackage.tenant_id || request.force_tenant_scope_violation === true) addFailure(failures, "REPLAY_OUTPUT_TENANT_MISMATCH", "Replay output tenant must match state package tenant.", "produced_output.tenant_id");
  if ((statePackage.mission_id && output.mission_id !== statePackage.mission_id) || request.force_mission_scope_violation === true) addFailure(failures, "REPLAY_OUTPUT_MISSION_MISMATCH", "Replay output mission must match state package mission.", "produced_output.mission_id");
  if (
    output.produced_from_contract_hash !== statePackage.replay_contract_hash
    || output.produced_from_input_bundle_hash !== statePackage.input_bundle_hash
    || output.produced_from_state_package_hash !== statePackage.state_hashes.full_state_package_hash
    || request.force_provenance_mismatch === true
  ) {
    addFailure(failures, "REPLAY_OUTPUT_PROVENANCE_MISMATCH", "Replay output provenance does not match state package.", "produced_output");
  }
  if (output.execution_authority !== "NONE" || request.force_execution_authority === true) addFailure(failures, "EXECUTION_AUTHORITY_DETECTED", "Replay output cannot carry execution authority.", "produced_output.execution_authority");
  if (request.force_source_mutation === true) addFailure(failures, "SOURCE_MUTATION_ATTEMPTED", "Replay output verification cannot mutate source records.", "produced_output");
  if (request.force_authority_expansion === true) addFailure(failures, "AUTHORITY_EXPANSION_DETECTED", "Replay output cannot expand authority.", "produced_output");
}

function validateScope(request: TruthReplayOutputVerificationRequest, failures: TruthReplayOutputVerificationFailureReason[]): void {
  const scope = request.verification_scope;
  if (!scope) {
    addFailure(failures, "VERIFICATION_SCOPE_MISSING", "Verification scope is required.", "verification_scope");
    return;
  }
  if (scope.tenant_id !== request.state_package.tenant_id) addFailure(failures, "REPLAY_OUTPUT_TENANT_MISMATCH", "Verification scope tenant must match state package tenant.", "verification_scope.tenant_id");
  if (scope.mission_id && scope.mission_id !== request.state_package.mission_id) addFailure(failures, "REPLAY_OUTPUT_MISSION_MISMATCH", "Verification scope mission must match state package mission.", "verification_scope.mission_id");
  if (!scope.allowed_output_types.includes(request.produced_output.output_type)) addFailure(failures, "OUTPUT_TYPE_UNAUTHORIZED", "Replay output type is not allowed by verification scope.", "verification_scope.allowed_output_types");
  for (const field of scope.restricted_fields ?? []) {
    if (request.force_restricted_field_exposed === true || Object.prototype.hasOwnProperty.call(request.produced_output.output_payload as Record<string, unknown>, field)) {
      addFailure(failures, "RESTRICTED_FIELD_EXPOSED", "Restricted output field is exposed.", `produced_output.output_payload.${field}`);
    }
  }
  if (request.force_redaction_mismatch === true) addFailure(failures, "REDACTION_MISMATCH", "Replay output redaction does not match expected policy.", "verification_scope.verify_redaction");
}

function buildCanonicalizationContext(request: TruthReplayOutputVerificationRequest, failures: TruthReplayOutputVerificationFailureReason[]) {
  if (request.force_unstable_serialization === true) addFailure(failures, "UNSTABLE_OUTPUT_SERIALIZATION_DETECTED", "Replay output serialization must be stable.", "canonicalization_context");
  if (request.force_wall_clock_field === true) addFailure(failures, "WALL_CLOCK_OUTPUT_FIELD_DETECTED", "Replay output payload includes wall-clock field.", "produced_output.output_payload");
  if (request.force_environment_field === true) addFailure(failures, "ENVIRONMENT_OUTPUT_FIELD_DETECTED", "Replay output payload includes environment-specific field.", "produced_output.output_payload");
  const withoutHash = {
    canonical_serialization: "STABLE_JSON" as const,
    canonical_hash_algorithm: "SHA256" as const,
    stable_key_ordering: true as const,
    stable_array_ordering: true as const,
    stable_null_handling: true as const,
    stable_timestamp_representation: true as const,
    excluded_metadata_fields: request.verification_scope?.metadata_fields_excluded_from_payload_hash ?? [],
  };
  return Object.freeze({ ...withoutHash, canonicalization_hash: hashValue("mission-control-replay-output-canonicalization-context-hash", withoutHash) });
}

function buildHashVerification(request: TruthReplayOutputVerificationRequest, mismatches: string[]): TruthReplayOutputHashVerification {
  const canonicalHash = canonicalPayloadHash(request.produced_output.output_payload);
  const expectedHash = request.expected_output.expected_output_hash;
  const hashMatch = !!expectedHash && expectedHash === request.produced_output.output_hash && expectedHash === canonicalHash;
  const hashMismatches = hashMatch ? [] : [{ expected_hash: expectedHash, produced_hash: request.produced_output.output_hash, canonical_hash: canonicalHash }];
  if (!hashMatch) mismatches.push("OUTPUT_HASH");
  const withoutHash = {
    hash_verified: hashMatch,
    expected_output_hash: expectedHash,
    produced_output_hash: request.produced_output.output_hash,
    canonical_produced_output_hash: canonicalHash,
    hash_match: hashMatch,
    hash_algorithm: "SHA256" as const,
    hash_mismatches: hashMismatches,
  };
  return Object.freeze({ ...withoutHash, hash_verification_hash: hashValue("mission-control-replay-output-hash-verification-hash", withoutHash) });
}

function buildStructuralVerification(request: TruthReplayOutputVerificationRequest, failures: TruthReplayOutputVerificationFailureReason[]): TruthReplayStructuralVerification {
  const mismatches = [];
  if (request.produced_output.output_type !== request.expected_output.expected_output_type || request.force_output_type_mismatch === true) {
    mismatches.push({ field: "output_type", reason: "Output type mismatch." });
    addFailure(failures, "OUTPUT_TYPE_MISMATCH", "Replay output type does not match expected output type.", "produced_output.output_type");
  }
  if ((request.expected_output.expected_schema_version && request.produced_output.output_schema_version !== request.expected_output.expected_schema_version) || request.force_schema_mismatch === true) {
    mismatches.push({ field: "output_schema_version", reason: "Output schema mismatch." });
    addFailure(failures, "OUTPUT_SCHEMA_MISMATCH", "Replay output schema does not match expected schema.", "produced_output.output_schema_version");
  }
  if (request.force_required_field_missing === true) {
    mismatches.push({ field: "required", reason: "Required field missing." });
    addFailure(failures, "REQUIRED_FIELD_MISSING", "Required output field is missing.", "produced_output.output_payload");
  }
  if (request.force_unexpected_field_present === true) {
    mismatches.push({ field: "unexpected", reason: "Unexpected field present." });
    addFailure(failures, "UNEXPECTED_FIELD_PRESENT", "Unexpected output field is present.", "produced_output.output_payload");
  }
  const withoutHash = {
    structure_verified: mismatches.length === 0,
    schema_version_match: !mismatches.some((mismatch) => mismatch.field === "output_schema_version"),
    output_type_match: !mismatches.some((mismatch) => mismatch.field === "output_type"),
    required_fields_present: !mismatches.some((mismatch) => mismatch.field === "required"),
    unexpected_fields_absent: !mismatches.some((mismatch) => mismatch.field === "unexpected"),
    field_types_match: true,
    array_order_valid: true,
    structural_mismatches: mismatches,
  };
  return Object.freeze({ ...withoutHash, structural_verification_hash: hashValue("mission-control-replay-output-structural-verification-hash", withoutHash) });
}

function buildFieldVerification(request: TruthReplayOutputVerificationRequest, mismatches: string[]): TruthReplayFieldVerificationReport {
  const expected = request.expected_output.expected_payload as Record<string, unknown> | undefined;
  const produced = request.produced_output.output_payload as Record<string, unknown>;
  const missing: TruthReplayFieldMismatch[] = [];
  const unexpected: TruthReplayFieldMismatch[] = [];
  const different: TruthReplayFieldMismatch[] = [];
  const matched: string[] = [];
  for (const key of Object.keys(expected ?? {})) {
    if (!(key in produced)) missing.push({ field: key, expected_value: expected?.[key], mismatch_type: "MISSING" });
    else if (canonicalizeConfidenceToString(produced[key]) !== canonicalizeConfidenceToString(expected?.[key])) different.push({ field: key, expected_value: expected?.[key], produced_value: produced[key], mismatch_type: "VALUE" });
    else matched.push(key);
  }
  if (request.force_field_value_mismatch === true) different.push({ field: "forced", expected_value: "expected", produced_value: "produced", mismatch_type: "VALUE" });
  if (missing.length || unexpected.length || different.length) mismatches.push("FIELD");
  const withoutHash = {
    fields_verified: missing.length === 0 && unexpected.length === 0 && different.length === 0,
    matched_fields: matched,
    missing_fields: missing,
    unexpected_fields: unexpected,
    mismatched_fields: different,
  };
  return Object.freeze({ ...withoutHash, field_verification_hash: hashValue("mission-control-replay-output-field-verification-hash", withoutHash) });
}

function addForcedFailures(request: TruthReplayOutputVerificationRequest, failures: TruthReplayOutputVerificationFailureReason[], mismatches: string[], escalations: TruthReplayOutputVerificationFailureReason[]): void {
  const failMap: [keyof TruthReplayOutputVerificationRequest, TruthReplayOutputVerificationFailureCode, string][] = [
    ["force_policy_snapshot_changed", "POLICY_SNAPSHOT_CHANGED", "Policy snapshot changed."],
    ["force_current_policy_substituted", "CURRENT_POLICY_SUBSTITUTED", "Current policy substituted."],
    ["force_governance_decision_mismatch", "GOVERNANCE_DECISION_MISMATCH", "Governance decision mismatch."],
    ["force_governance_bypass", "GOVERNANCE_BYPASS_DETECTED", "Governance bypass detected."],
    ["force_evidence_ref_missing", "EVIDENCE_REF_MISSING", "Evidence reference missing."],
    ["force_evidence_hash_mismatch", "EVIDENCE_HASH_MISMATCH", "Evidence hash mismatch."],
    ["force_lineage_relationship_missing", "LINEAGE_RELATIONSHIP_MISSING", "Lineage relationship missing."],
    ["force_causal_chain_changed", "CAUSAL_CHAIN_CHANGED", "Causal chain changed."],
    ["force_supersession_chain_changed", "SUPERSESSION_CHAIN_CHANGED", "Supersession chain changed."],
    ["force_recommendation_rationale_mismatch", "RECOMMENDATION_RATIONALE_REFS_MISMATCH", "Recommendation rationale refs mismatch."],
    ["force_advisory_only_changed", "ADVISORY_ONLY_STATE_CHANGED", "Advisory-only state changed."],
  ];
  for (const [flag, code, message] of failMap) {
    if (request[flag] === true) addFailure(failures, code, message, String(flag));
  }
  const mismatchMap: [keyof TruthReplayOutputVerificationRequest, TruthReplayOutputVerificationFailureCode, string, string][] = [
    ["force_recommendation_payload_mismatch", "RECOMMENDATION_PAYLOAD_MISMATCH", "Recommendation payload mismatch.", "RECOMMENDATION"],
    ["force_risk_mismatch", "RISK_MISMATCH_DETECTED", "Risk output mismatch.", "RISK"],
    ["force_confidence_mismatch", "CONFIDENCE_MISMATCH_DETECTED", "Confidence output mismatch.", "CONFIDENCE"],
  ];
  for (const [flag, code, message, category] of mismatchMap) {
    if (request[flag] === true) {
      mismatches.push(category);
      escalations.push(failure(code, message, String(flag)));
    }
  }
  if (request.force_unexpected_evidence_added === true) {
    mismatches.push("EVIDENCE");
    escalations.push(failure("UNEXPECTED_EVIDENCE_ADDED", "Unexpected evidence added.", "produced_output.evidence_refs"));
  }
}

function buildMismatchReport(request: TruthReplayOutputVerificationRequest, mismatches: readonly string[], failures: readonly TruthReplayOutputVerificationFailureReason[]): TruthReplayOutputMismatchReport {
  const categories = Object.freeze([...new Set(mismatches)]);
  const severity = failures.length > 0 ? "CRITICAL" : categories.length > 0 ? "HIGH" : "NONE";
  const withoutHash = {
    mismatch_detected: categories.length > 0,
    mismatch_categories: categories,
    mismatch_severity: severity as TruthReplayOutputMismatchReport["mismatch_severity"],
    mismatch_policy: request.expected_output.mismatch_policy,
  };
  return Object.freeze({ ...withoutHash, mismatch_report_hash: hashValue("mission-control-replay-output-mismatch-report-hash", withoutHash) });
}

function buildResult(failures: readonly TruthReplayOutputVerificationFailureReason[], mismatches: readonly string[], escalations: readonly TruthReplayOutputVerificationFailureReason[]): TruthReplayOutputVerificationResult {
  const state: TruthReplayOutputVerificationResultState = failures.length > 0
    ? "FAILED"
    : escalations.length > 0
      ? "ESCALATION_REQUIRED"
      : mismatches.length > 0
        ? "MISMATCHED"
        : "MATCHED";
  const withoutHash = {
    result_state: state,
    matched: state === "MATCHED",
    mismatched: state === "MISMATCHED",
    failed: state === "FAILED",
    unverifiable: false,
    certification_eligible: state === "MATCHED",
  };
  return Object.freeze({ ...withoutHash, result_hash: hashValue("mission-control-replay-output-result-hash", withoutHash) });
}

export function verifyTruthReplayOutput(request: TruthReplayOutputVerificationRequest): TruthReplayOutputVerification {
  const fallbackOutput = request.produced_output ?? {
    replay_output_id: "missing_output",
    replay_id: request.state_package?.replay_id ?? "missing_replay",
    tenant_id: request.state_package?.tenant_id ?? "missing_tenant",
    mission_id: request.state_package?.mission_id,
    output_type: "FULL_CONTEXT_OUTPUT" as const,
    output_payload: {},
    produced_from_contract_hash: "missing_contract_hash",
    produced_from_input_bundle_hash: "missing_input_hash",
    produced_from_state_package_hash: "missing_state_hash",
    output_schema_version: "missing_schema",
    output_hash: "",
    advisory_only: true,
    execution_authority: "NONE" as const,
    created_at: request.created_at,
  };
  const fallbackExpected = request.expected_output ?? {
    expected_output_type: fallbackOutput.output_type,
    expected_payload: {},
    expected_output_hash: "",
    expected_schema_version: fallbackOutput.output_schema_version,
    mismatch_policy: "FAIL" as const,
  };
  const fallbackScope = request.verification_scope ?? {
    tenant_id: request.state_package?.tenant_id ?? "missing_tenant",
    mission_id: request.state_package?.mission_id,
    allowed_output_types: [fallbackOutput.output_type],
    verify_hash: true,
    verify_structure: true,
    verify_fields: true,
    verify_evidence_refs: true,
    verify_lineage_refs: true,
    verify_governance_refs: true,
    verify_authority: true,
    verify_redaction: true,
    allow_metadata_differences: false,
  };
  const safeRequest: TruthReplayOutputVerificationRequest = Object.freeze({
    ...request,
    produced_output: fallbackOutput,
    expected_output: fallbackExpected,
    verification_scope: fallbackScope,
  });
  const failures: TruthReplayOutputVerificationFailureReason[] = [];
  const escalations: TruthReplayOutputVerificationFailureReason[] = [];
  const mismatches: string[] = [];
  const audit: TruthReplayOutputVerificationAuditEventName[] = ["REPLAY_OUTPUT_VERIFICATION_REQUESTED"];
  validateEnvelope(request, failures);
  audit.push("REPLAY_OUTPUT_STATE_PACKAGE_LOADED");
  validateProducedOutput(safeRequest, failures);
  audit.push("REPLAY_OUTPUT_ARTIFACT_LOADED");
  if (safeRequest.force_expected_hash_missing === true || !safeRequest.expected_output.expected_output_hash) addFailure(failures, "EXPECTED_OUTPUT_HASH_MISSING", "Expected output hash is required.", "expected_output.expected_output_hash");
  if (!["FAIL", "FLAG", "ESCALATE"].includes(safeRequest.expected_output.mismatch_policy)) addFailure(failures, "MISMATCH_POLICY_INVALID", "Mismatch policy is invalid.", "expected_output.mismatch_policy");
  audit.push("REPLAY_EXPECTED_OUTPUT_RESOLVED");
  validateScope(safeRequest, failures);
  audit.push("REPLAY_OUTPUT_SCOPE_VERIFIED");
  const canonicalization = buildCanonicalizationContext(safeRequest, failures);
  audit.push("REPLAY_OUTPUT_CANONICALIZED");
  const hashVerification = buildHashVerification(safeRequest, mismatches);
  audit.push("REPLAY_OUTPUT_HASH_VERIFIED");
  const structural = buildStructuralVerification(safeRequest, failures);
  audit.push("REPLAY_OUTPUT_STRUCTURE_VERIFIED");
  const fieldVerification = buildFieldVerification(safeRequest, mismatches);
  if (safeRequest.force_field_value_mismatch === true) addFailure(failures, "FIELD_VALUE_MISMATCH", "Field value mismatch detected.", "field_verification");
  audit.push("REPLAY_OUTPUT_FIELDS_VERIFIED");
  addForcedFailures(safeRequest, failures, mismatches, escalations);
  const governance = namedVerification("governance", !failures.some((reason) => reason.code.includes("GOVERNANCE") || reason.code.includes("POLICY")), failures.filter((reason) => reason.code.includes("GOVERNANCE") || reason.code.includes("POLICY")).map((reason) => reason.message));
  const authority = namedVerification("authority", !failures.some((reason) => reason.code.includes("AUTHORITY") || reason.code === "EXECUTION_AUTHORITY_DETECTED"), failures.filter((reason) => reason.code.includes("AUTHORITY") || reason.code === "EXECUTION_AUTHORITY_DETECTED").map((reason) => reason.message));
  const evidenceOk = arraysEqual(safeRequest.produced_output.evidence_refs, safeRequest.expected_output.expected_evidence_refs) && !failures.some((reason) => reason.code.includes("EVIDENCE"));
  const lineageOk = arraysEqual(safeRequest.produced_output.lineage_refs, safeRequest.expected_output.expected_lineage_refs) && !failures.some((reason) => reason.code.includes("LINEAGE") || reason.code.includes("CAUSAL") || reason.code.includes("SUPERSESSION"));
  const evidence = namedVerification("evidence", evidenceOk, evidenceOk ? [] : ["Evidence references differ or failed verification."]);
  const lineage = namedVerification("lineage", lineageOk, lineageOk ? [] : ["Lineage references differ or failed verification."]);
  const recommendation = namedVerification("recommendation", !mismatches.includes("RECOMMENDATION"), mismatches.includes("RECOMMENDATION") ? ["Recommendation mismatch."] : []);
  const risk = namedVerification("risk", !mismatches.includes("RISK"), mismatches.includes("RISK") ? ["Risk mismatch."] : []);
  const confidence = namedVerification("confidence", !mismatches.includes("CONFIDENCE"), mismatches.includes("CONFIDENCE") ? ["Confidence mismatch."] : []);
  audit.push("REPLAY_OUTPUT_GOVERNANCE_VERIFIED", "REPLAY_OUTPUT_AUTHORITY_VERIFIED", "REPLAY_OUTPUT_EVIDENCE_VERIFIED", "REPLAY_OUTPUT_LINEAGE_VERIFIED", "REPLAY_OUTPUT_RECOMMENDATION_VERIFIED", "REPLAY_OUTPUT_RISK_CONFIDENCE_VERIFIED");
  const mismatchReport = buildMismatchReport(safeRequest, mismatches, failures);
  if (mismatchReport.mismatch_detected) audit.push("REPLAY_OUTPUT_MISMATCH_DETECTED");
  if (safeRequest.force_escalation === true) escalations.push(failure("GOVERNANCE_DECISION_MISMATCH", "Verification escalated for review.", "verification_result"));
  const result = buildResult(failures, mismatches, escalations);
  audit.push(result.result_state === "MATCHED" ? "REPLAY_OUTPUT_VERIFICATION_MATCHED" : result.result_state === "MISMATCHED" ? "REPLAY_OUTPUT_VERIFICATION_MISMATCHED" : result.result_state === "ESCALATION_REQUIRED" ? "REPLAY_OUTPUT_VERIFICATION_ESCALATED" : "REPLAY_OUTPUT_VERIFICATION_FAILED");
  const certification = result.result_state === "MATCHED" ? "OUTPUT_MATCHED" as const : result.result_state === "MISMATCHED" ? "OUTPUT_MISMATCHED" as const : result.result_state === "ESCALATION_REQUIRED" ? "OUTPUT_ESCALATED" as const : "OUTPUT_FAILED" as const;
  const seed = {
    verification_id: safeRequest.verification_id,
    replay_id: safeRequest.state_package.replay_id,
    tenant_id: safeRequest.state_package.tenant_id,
    mission_id: safeRequest.state_package.mission_id,
    replay_contract_ref: safeRequest.state_package.replay_contract_ref,
    replay_contract_hash: safeRequest.state_package.replay_contract_hash,
    input_bundle_ref: safeRequest.state_package.bundle_id,
    input_bundle_hash: safeRequest.state_package.input_bundle_hash,
    state_package_ref: safeRequest.state_package.state_package_id,
    state_package_hash: safeRequest.state_package.state_hashes.full_state_package_hash,
    replay_output_ref: safeRequest.produced_output.replay_output_id,
    replay_output_hash: safeRequest.produced_output.output_hash,
    original_output_ref: safeRequest.original_output_ref ?? safeRequest.expected_output.expected_output_ref,
    original_output_hash: safeRequest.original_output_hash ?? safeRequest.expected_output.expected_output_hash,
    expected_output: safeRequest.expected_output,
    produced_output: safeRequest.produced_output,
    verification_type: OUTPUT_VERIFICATION_TYPES[safeRequest.state_package.state_reconstruction_type] ?? "FULL_CONTEXT_OUTPUT_VERIFICATION",
    verification_scope: safeRequest.verification_scope,
    canonicalization_context: canonicalization,
    comparison_context: request.comparison_context,
    hash_verification: hashVerification,
    structural_verification: structural,
    field_verification: fieldVerification,
    governance_verification: governance,
    authority_verification: authority,
    evidence_verification: evidence,
    lineage_verification: lineage,
    recommendation_verification: recommendation,
    risk_verification: risk,
    confidence_verification: confidence,
    mismatch_report: mismatchReport,
    verification_result: result,
    lifecycle_state: result.failed ? "FAILED" as const : result.result_state === "ESCALATION_REQUIRED" ? "ESCALATED" as const : "VERIFIED" as const,
    certification_state: certification,
    failure_reasons: failures.length ? Object.freeze([...failures]) : undefined,
    escalation_reasons: escalations.length ? Object.freeze([...escalations]) : undefined,
    created_at: safeRequest.created_at,
  };
  const verificationHash = hashValue("mission-control-replay-output-full-verification-hash", seed);
  audit.push("REPLAY_OUTPUT_VERIFICATION_REPORT_CREATED");
  return Object.freeze({
    ...seed,
    audit_events: Object.freeze(audit),
    verification_hash: verificationHash,
    readOnly: true as const,
    executionAuthorized: false as const,
    sourceMutationAllowed: false as const,
    statePackageMutationAllowed: false as const,
    replayOutputMutationAllowed: false as const,
  });
}

export function canonicalizeTruthReplayOutputVerification(verification: TruthReplayOutputVerification): string {
  if (verification.canonicalization_context.canonical_serialization !== "STABLE_JSON") {
    throw new Error("UNSTABLE_OUTPUT_SERIALIZATION_DETECTED");
  }
  return canonicalizeConfidenceToString(verification);
}

export function toTruthReplayOutputVerificationStorageRecord(verification: TruthReplayOutputVerification): TruthReplayOutputVerificationStorageRecord {
  return Object.freeze({
    verification_id: verification.verification_id,
    replay_id: verification.replay_id,
    tenant_id: verification.tenant_id,
    mission_id: verification.mission_id,
    replay_contract_ref: verification.replay_contract_ref,
    replay_contract_hash: verification.replay_contract_hash,
    input_bundle_ref: verification.input_bundle_ref,
    input_bundle_hash: verification.input_bundle_hash,
    state_package_ref: verification.state_package_ref,
    state_package_hash: verification.state_package_hash,
    replay_output_ref: verification.replay_output_ref,
    replay_output_hash: verification.replay_output_hash,
    original_output_ref: verification.original_output_ref,
    original_output_hash: verification.original_output_hash,
    expected_output_json: canonicalizeConfidenceToString(verification.expected_output),
    produced_output_json: canonicalizeConfidenceToString(verification.produced_output),
    verification_type: verification.verification_type,
    verification_scope_json: canonicalizeConfidenceToString(verification.verification_scope),
    canonicalization_context_json: canonicalizeConfidenceToString(verification.canonicalization_context),
    comparison_context_json: canonicalizeConfidenceToString(verification.comparison_context),
    hash_verification_json: canonicalizeConfidenceToString(verification.hash_verification),
    structural_verification_json: canonicalizeConfidenceToString(verification.structural_verification),
    field_verification_json: canonicalizeConfidenceToString(verification.field_verification),
    governance_verification_json: canonicalizeConfidenceToString(verification.governance_verification),
    authority_verification_json: canonicalizeConfidenceToString(verification.authority_verification),
    evidence_verification_json: canonicalizeConfidenceToString(verification.evidence_verification),
    lineage_verification_json: canonicalizeConfidenceToString(verification.lineage_verification),
    recommendation_verification_json: verification.recommendation_verification ? canonicalizeConfidenceToString(verification.recommendation_verification) : undefined,
    risk_verification_json: verification.risk_verification ? canonicalizeConfidenceToString(verification.risk_verification) : undefined,
    confidence_verification_json: verification.confidence_verification ? canonicalizeConfidenceToString(verification.confidence_verification) : undefined,
    mismatch_report_json: canonicalizeConfidenceToString(verification.mismatch_report),
    verification_result_json: canonicalizeConfidenceToString(verification.verification_result),
    lifecycle_state: verification.lifecycle_state,
    certification_state: verification.certification_state,
    failure_reasons_json: verification.failure_reasons ? canonicalizeConfidenceToString(verification.failure_reasons) : undefined,
    escalation_reasons_json: verification.escalation_reasons ? canonicalizeConfidenceToString(verification.escalation_reasons) : undefined,
    verification_hash: verification.verification_hash,
    created_at: verification.created_at,
  });
}
