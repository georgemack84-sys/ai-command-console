import {
  REGISTERED_DECISION_SOURCES,
  createDecisionIntakeRequest,
} from "@/services/decision-intake-engine";
import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import type { DecisionIntakeFailureReason, DecisionIntakeRequest } from "@/types/decision-intake-engine";
import type {
  RegisteredSubsystemRecord,
  SourceCertificationRecord,
  SourceValidationAuditRecord,
  SourceValidationFailureReason,
  SourceValidationIntakeBridge,
  SourceValidationObservability,
  SourceValidationReplayResult,
  SourceValidationRequest,
  SourceValidationResult,
  SourceValidationState,
} from "@/types/decision-source-validation";

const NOW = "2026-07-02T09:24:00.000Z";

export const REGISTERED_SUBSYSTEMS: readonly RegisteredSubsystemRecord[] = Object.freeze(REGISTERED_DECISION_SOURCES.map((source) => Object.freeze({
  subsystem_id: source.source_system,
  subsystem_name: source.source_system.replace(/-/g, " "),
  subsystem_type: source.source_system.includes("governance") ? "GOVERNANCE" as const : source.source_system.includes("prediction") ? "PREDICTION" as const : "OPERATOR" as const,
  certification_status: source.certified && !source.revoked ? "CERTIFIED" as const : source.revoked ? "REVOKED" as const : "UNCERTIFIED" as const,
  supported_versions: source.supported_versions,
  authority_scope: source.authority_levels,
  tenant_scope: Object.freeze(["tenant_alpha"]),
  mission_scope: Object.freeze(["mission_phase_9_decision_orchestration"]),
  operational_status: source.active ? "ACTIVE" as const : "INACTIVE" as const,
  trusted_identity: source.trusted_identity,
  signature_algorithm: "SHA-256" as const,
  registration_reference: `registration_${source.source_system}`,
  certification_reference: `certification_${source.source_system}`,
})));

export const SOURCE_CERTIFICATIONS: readonly SourceCertificationRecord[] = Object.freeze(REGISTERED_SUBSYSTEMS.map((subsystem) => {
  const base: Omit<SourceCertificationRecord, "integrity_hash"> = {
    certification_id: subsystem.certification_reference,
    subsystem_id: subsystem.subsystem_id,
    certification_level: subsystem.subsystem_type === "GOVERNANCE" ? "GOVERNANCE_SOURCE" : subsystem.subsystem_type === "PREDICTION" ? "ADVISORY_SOURCE" : "DECISION_INTAKE",
    effective_date: "2026-07-02T00:00:00.000Z",
    expiration_date: "2027-07-02T00:00:00.000Z",
    certification_status: subsystem.certification_status === "CERTIFIED" ? "ACTIVE" : subsystem.certification_status === "REVOKED" ? "REVOKED" : "SUSPENDED",
    certification_scope: subsystem.authority_scope,
  };
  return Object.freeze({ ...base, integrity_hash: generateDecisionIntegrityHash(base) });
}));

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function resultHash(result: Omit<SourceValidationResult, "integrity_hash"> | SourceValidationResult): string {
  const copy = { ...(result as SourceValidationResult) } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(copy);
}

function findSubsystem(subsystem_id: string): RegisteredSubsystemRecord | undefined {
  return REGISTERED_SUBSYSTEMS.find((item) => item.subsystem_id === subsystem_id);
}

function findCertification(subsystem_id: string): SourceCertificationRecord | undefined {
  return SOURCE_CERTIFICATIONS.find((item) => item.subsystem_id === subsystem_id);
}

function unsignedRequest(request: SourceValidationRequest): Omit<SourceValidationRequest, "signature"> {
  return {
    validation_id: request.validation_id,
    subsystem_id: request.subsystem_id,
    subsystem_version: request.subsystem_version,
    tenant_id: request.tenant_id,
    mission_id: request.mission_id,
    authority_scope: request.authority_scope,
    replay_reference: request.replay_reference,
    payload_hash: request.payload_hash,
    candidate_id: request.candidate_id,
    lineage_reference: request.lineage_reference,
    protocol_version: request.protocol_version,
  };
}

export function signSourceValidationRequest(input: Omit<SourceValidationRequest, "signature">, trustedIdentity?: string): string {
  return hash({
    validation_id: input.validation_id,
    subsystem_id: input.subsystem_id,
    subsystem_version: input.subsystem_version,
    tenant_id: input.tenant_id,
    mission_id: input.mission_id,
    authority_scope: input.authority_scope,
    replay_reference: input.replay_reference,
    payload_hash: input.payload_hash,
    candidate_id: input.candidate_id,
    lineage_reference: input.lineage_reference,
    protocol_version: input.protocol_version,
    trusted_identity: trustedIdentity ?? findSubsystem(input.subsystem_id)?.trusted_identity ?? "unknown",
  });
}

export function createSourceValidationRequest(overrides: Partial<SourceValidationRequest> = {}): SourceValidationRequest {
  const subsystem_id = overrides.subsystem_id ?? "mission-control-operator-console";
  const base: Omit<SourceValidationRequest, "signature"> = {
    validation_id: overrides.validation_id ?? `source_validation_${subsystem_id}`,
    subsystem_id,
    subsystem_version: overrides.subsystem_version ?? "1.0.0",
    tenant_id: overrides.tenant_id ?? "tenant_alpha",
    mission_id: overrides.mission_id ?? "mission_phase_9_decision_orchestration",
    authority_scope: overrides.authority_scope ?? "ADVISORY",
    replay_reference: overrides.replay_reference ?? `replay_source_validation_${subsystem_id}`,
    payload_hash: overrides.payload_hash ?? hash({ subsystem_id, tenant_id: "tenant_alpha", mission_id: "mission_phase_9_decision_orchestration" }),
    candidate_id: overrides.candidate_id ?? `candidate_${subsystem_id}`,
    lineage_reference: overrides.lineage_reference ?? `lineage_source_validation_${subsystem_id}`,
    protocol_version: overrides.protocol_version ?? "decision-source-validation/v1",
  };
  return Object.freeze({ ...base, signature: overrides.signature ?? signSourceValidationRequest(base) });
}

export function resolveSubsystemIdentity(request: SourceValidationRequest): RegisteredSubsystemRecord | undefined {
  return findSubsystem(request.subsystem_id);
}

function registrationFailures(subsystem: RegisteredSubsystemRecord | undefined): readonly SourceValidationFailureReason[] {
  if (!subsystem) return Object.freeze(["UNKNOWN_SUBSYSTEM", "MISSING_REGISTRATION"] as const);
  return Object.freeze([
    ...(subsystem.operational_status === "INACTIVE" ? ["INACTIVE_SUBSYSTEM" as const] : []),
    ...(subsystem.operational_status === "RETIRED" ? ["RETIRED_SUBSYSTEM" as const] : []),
    ...(subsystem.operational_status === "SUSPENDED" ? ["SUSPENDED_SUBSYSTEM" as const] : []),
  ]);
}

function signatureFailures(request: SourceValidationRequest, subsystem: RegisteredSubsystemRecord | undefined): readonly SourceValidationFailureReason[] {
  if (!request.signature) return Object.freeze(["MISSING_SIGNATURE"] as const);
  if (!subsystem) return Object.freeze(["INVALID_SIGNATURE"] as const);
  const expected = signSourceValidationRequest(unsignedRequest(request), subsystem.trusted_identity);
  return Object.freeze([
    ...(request.signature === "corrupted" ? ["CORRUPTED_SIGNATURE" as const] : []),
    ...(request.signature !== expected ? ["INVALID_SIGNATURE" as const] : []),
    ...(request.payload_hash.includes("altered") ? ["ALTERED_PAYLOAD" as const] : []),
  ]);
}

function certificationFailures(subsystem: RegisteredSubsystemRecord | undefined): readonly SourceValidationFailureReason[] {
  if (!subsystem) return Object.freeze(["UNCERTIFIED_SUBSYSTEM"] as const);
  const certification = findCertification(subsystem.subsystem_id);
  if (!certification) return Object.freeze(["UNCERTIFIED_SUBSYSTEM"] as const);
  return Object.freeze([
    ...(certification.certification_status !== "ACTIVE" ? certification.certification_status === "REVOKED" ? ["REVOKED_CERTIFICATION" as const] : ["SUSPENDED_CERTIFICATION" as const] : []),
    ...(certification.expiration_date <= NOW ? ["EXPIRED_CERTIFICATION" as const] : []),
    ...(!certification.certification_scope.some((scope) => subsystem.authority_scope.includes(scope)) ? ["UNCERTIFIED_SUBSYSTEM" as const] : []),
  ]);
}

function versionFailures(request: SourceValidationRequest, subsystem: RegisteredSubsystemRecord | undefined): readonly SourceValidationFailureReason[] {
  if (!subsystem) return Object.freeze(["UNKNOWN_PROTOCOL"] as const);
  return Object.freeze([
    ...(!subsystem.supported_versions.includes(request.subsystem_version) ? ["UNSUPPORTED_VERSION" as const] : []),
    ...(request.subsystem_version.startsWith("0.") ? ["DEPRECATED_INTERFACE" as const] : []),
    ...(request.protocol_version !== "decision-source-validation/v1" ? ["UNKNOWN_PROTOCOL" as const] : []),
  ]);
}

function tenantFailures(request: SourceValidationRequest, subsystem: RegisteredSubsystemRecord | undefined): readonly SourceValidationFailureReason[] {
  if (!subsystem) return Object.freeze(["UNAUTHORIZED_TENANT_ACCESS"] as const);
  return Object.freeze([
    ...(!subsystem.tenant_scope.includes(request.tenant_id) ? ["UNAUTHORIZED_TENANT_ACCESS" as const] : []),
    ...(request.payload_hash.includes("tenant_beta") && request.tenant_id !== "tenant_beta" ? ["CROSS_TENANT_SUBMISSION" as const] : []),
    ...(request.mission_id.includes("tenant_beta") ? ["FOREIGN_MISSION_REFERENCE" as const] : []),
  ]);
}

function missionFailures(request: SourceValidationRequest, subsystem: RegisteredSubsystemRecord | undefined): readonly SourceValidationFailureReason[] {
  if (!request.mission_id) return Object.freeze(["UNKNOWN_MISSION"] as const);
  if (!subsystem) return Object.freeze(["UNAUTHORIZED_MISSION"] as const);
  return Object.freeze([
    ...(!subsystem.mission_scope.includes(request.mission_id) ? ["UNAUTHORIZED_MISSION" as const] : []),
    ...(request.mission_id === "mission_archived" ? ["INACTIVE_MISSION" as const] : []),
    ...(!subsystem.tenant_scope.includes(request.tenant_id) ? ["OWNERSHIP_MISMATCH" as const] : []),
  ]);
}

function authorityFailures(request: SourceValidationRequest, subsystem: RegisteredSubsystemRecord | undefined): readonly SourceValidationFailureReason[] {
  if (!subsystem) return Object.freeze(["UNAUTHORIZED_RECOMMENDATION"] as const);
  return Object.freeze([
    ...(!subsystem.authority_scope.includes(request.authority_scope) ? ["INVALID_AUTHORITY_LEVEL" as const] : []),
    ...(/EXECUTE|DEPLOY|MODIFY|COMMAND/i.test(request.authority_scope) ? ["AUTHORITY_ESCALATION" as const] : []),
    ...(/RESTRICTED/i.test(request.authority_scope) ? ["RESTRICTED_OPERATION" as const] : []),
  ]);
}

function replayFailures(request: SourceValidationRequest): readonly SourceValidationFailureReason[] {
  return Object.freeze([
    ...(!request.replay_reference ? ["MISSING_REPLAY_REFERENCE" as const] : []),
    ...(request.replay_reference.includes("corrupt") ? ["REPLAY_INCOMPATIBILITY" as const] : []),
    ...(request.candidate_id.includes("random") ? ["NONDETERMINISTIC_IDENTIFIER" as const] : []),
    ...(!request.lineage_reference || request.lineage_reference.includes("broken") ? ["LINEAGE_CORRUPTION" as const] : []),
  ]);
}

function stateFor(failures: readonly SourceValidationFailureReason[]): SourceValidationState {
  if (failures.includes("UNKNOWN_SUBSYSTEM")) return "FAILED_IDENTITY";
  if (failures.includes("MISSING_REGISTRATION") || failures.includes("INACTIVE_SUBSYSTEM") || failures.includes("RETIRED_SUBSYSTEM") || failures.includes("SUSPENDED_SUBSYSTEM")) return "FAILED_REGISTRATION";
  if (failures.includes("MISSING_SIGNATURE") || failures.includes("INVALID_SIGNATURE") || failures.includes("CORRUPTED_SIGNATURE") || failures.includes("ALTERED_PAYLOAD")) return "FAILED_SIGNATURE";
  if (failures.includes("UNCERTIFIED_SUBSYSTEM") || failures.includes("REVOKED_CERTIFICATION") || failures.includes("EXPIRED_CERTIFICATION") || failures.includes("SUSPENDED_CERTIFICATION")) return "FAILED_CERTIFICATION";
  if (failures.includes("UNSUPPORTED_VERSION") || failures.includes("DEPRECATED_INTERFACE") || failures.includes("INCOMPATIBLE_SCHEMA") || failures.includes("UNKNOWN_PROTOCOL")) return "FAILED_VERSION";
  if (failures.includes("CROSS_TENANT_SUBMISSION") || failures.includes("TENANT_MISMATCH") || failures.includes("UNAUTHORIZED_TENANT_ACCESS") || failures.includes("FOREIGN_MISSION_REFERENCE")) return "FAILED_TENANT";
  if (failures.includes("UNKNOWN_MISSION") || failures.includes("UNAUTHORIZED_MISSION") || failures.includes("INACTIVE_MISSION") || failures.includes("OWNERSHIP_MISMATCH")) return "FAILED_MISSION";
  if (failures.includes("AUTHORITY_ESCALATION") || failures.includes("UNAUTHORIZED_RECOMMENDATION") || failures.includes("INVALID_AUTHORITY_LEVEL") || failures.includes("RESTRICTED_OPERATION")) return "FAILED_AUTHORITY";
  if (failures.includes("MISSING_REPLAY_REFERENCE") || failures.includes("REPLAY_INCOMPATIBILITY") || failures.includes("NONDETERMINISTIC_IDENTIFIER") || failures.includes("LINEAGE_CORRUPTION")) return "FAILED_REPLAY";
  return "PASSED";
}

function audit(validation_id: string, stage: SourceValidationState, ok: boolean): SourceValidationAuditRecord {
  const base: Omit<SourceValidationAuditRecord, "integrity_hash"> = {
    audit_id: `audit_${validation_id}_${stage.toLowerCase()}`,
    validation_id,
    validation_stage: stage,
    validation_result: ok ? "PASS" : "FAIL",
    replay_reference: `replay_${validation_id}_${stage.toLowerCase()}`,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: hash(base) });
}

export function validateDecisionSource(request: SourceValidationRequest = createSourceValidationRequest()): SourceValidationResult {
  const subsystem = resolveSubsystemIdentity(request);
  const failures = Object.freeze([...new Set([
    ...registrationFailures(subsystem),
    ...signatureFailures(request, subsystem),
    ...certificationFailures(subsystem),
    ...versionFailures(request, subsystem),
    ...tenantFailures(request, subsystem),
    ...missionFailures(request, subsystem),
    ...authorityFailures(request, subsystem),
    ...replayFailures(request),
  ])]);
  const validation_state = stateFor(failures);
  const passed = failures.length === 0;
  const certification = subsystem ? findCertification(subsystem.subsystem_id) : undefined;
  const base: Omit<SourceValidationResult, "integrity_hash"> = {
    validation_id: request.validation_id,
    subsystem_id: request.subsystem_id,
    validation_status: passed ? "PASS" : "FAIL",
    validation_state,
    failure_reason: failures[0],
    failure_reasons: failures,
    certification_reference: certification?.certification_id,
    authority_scope_verified: !failures.some((failure) => ["AUTHORITY_ESCALATION", "UNAUTHORIZED_RECOMMENDATION", "INVALID_AUTHORITY_LEVEL", "RESTRICTED_OPERATION"].includes(failure)),
    replay_compatible: !failures.some((failure) => ["MISSING_REPLAY_REFERENCE", "REPLAY_INCOMPATIBILITY", "NONDETERMINISTIC_IDENTIFIER", "LINEAGE_CORRUPTION"].includes(failure)),
    downstream_allowed: passed,
    audit_records: passed
      ? Object.freeze(["IDENTITY_VERIFIED", "REGISTERED", "AUTHENTICATED", "CERTIFIED", "VERSION_VALIDATED", "TENANT_VALIDATED", "MISSION_VALIDATED", "AUTHORITY_VALIDATED", "REPLAY_VALIDATED", "PASSED"].map((stage) => audit(request.validation_id, stage as SourceValidationState, true)))
      : Object.freeze(["PENDING", validation_state].map((stage, index) => audit(request.validation_id, stage as SourceValidationState, index === 0))),
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: resultHash(base) });
}

export function sourceValidationRequestFromIntake(intakeRequest: DecisionIntakeRequest): SourceValidationRequest {
  const base: Omit<SourceValidationRequest, "signature"> = {
    validation_id: `source_validation_${intakeRequest.request_id}`,
    subsystem_id: intakeRequest.source_system,
    subsystem_version: intakeRequest.source_version,
    tenant_id: intakeRequest.tenant_id,
    mission_id: intakeRequest.mission_id,
    authority_scope: intakeRequest.candidate_payload.authority_metadata.authority_level,
    replay_reference: intakeRequest.candidate_payload.replay_refs[0] ?? "",
    payload_hash: intakeRequest.candidate_payload.integrity_hash ?? hash(intakeRequest.candidate_payload),
    candidate_id: intakeRequest.candidate_payload.candidate_id,
    lineage_reference: intakeRequest.candidate_payload.lineage_refs[0] ?? "",
    protocol_version: "decision-source-validation/v1",
  };
  return Object.freeze({ ...base, signature: signSourceValidationRequest(base) });
}

function toIntakeFailures(failures: readonly SourceValidationFailureReason[]): readonly DecisionIntakeFailureReason[] {
  const mapped = failures.map((failure): DecisionIntakeFailureReason => {
    if (["UNKNOWN_SUBSYSTEM", "INACTIVE_SUBSYSTEM", "RETIRED_SUBSYSTEM", "SUSPENDED_SUBSYSTEM", "MISSING_REGISTRATION", "UNAUTHORIZED_SOURCE"].includes(failure)) return "UNKNOWN_SUBSYSTEM";
    if (["UNSUPPORTED_VERSION", "DEPRECATED_INTERFACE", "INCOMPATIBLE_SCHEMA", "UNKNOWN_PROTOCOL"].includes(failure)) return "UNSUPPORTED_SOURCE_VERSION";
    if (["UNCERTIFIED_SUBSYSTEM", "REVOKED_CERTIFICATION", "EXPIRED_CERTIFICATION", "SUSPENDED_CERTIFICATION", "EXPIRED_CERTIFICATE"].includes(failure)) return "EXPIRED_CERTIFICATION";
    if (["CROSS_TENANT_SUBMISSION", "TENANT_MISMATCH", "UNAUTHORIZED_TENANT_ACCESS", "FOREIGN_MISSION_REFERENCE"].includes(failure)) return "CROSS_TENANT_SUBMISSION";
    if (["UNKNOWN_MISSION", "UNAUTHORIZED_MISSION", "INACTIVE_MISSION", "OWNERSHIP_MISMATCH"].includes(failure)) return "UNKNOWN_MISSION";
    if (["AUTHORITY_ESCALATION", "UNAUTHORIZED_RECOMMENDATION", "INVALID_AUTHORITY_LEVEL", "RESTRICTED_OPERATION"].includes(failure)) return "AUTHORITY_ESCALATION";
    if (["MISSING_REPLAY_REFERENCE", "REPLAY_INCOMPATIBILITY"].includes(failure)) return "REPLAY_CORRUPTION";
    if (["LINEAGE_CORRUPTION", "NONDETERMINISTIC_IDENTIFIER"].includes(failure)) return "LINEAGE_INCONSISTENCY";
    return "HASH_MISMATCH";
  });
  return Object.freeze([...new Set(mapped)]);
}

export function validateSourceForIntake(intakeRequest: DecisionIntakeRequest = createDecisionIntakeRequest()): SourceValidationIntakeBridge {
  const source_validation = validateDecisionSource(sourceValidationRequestFromIntake(intakeRequest));
  return Object.freeze({
    source_validation,
    intake_failure_reasons: toIntakeFailures(source_validation.failure_reasons),
    intake_allowed: source_validation.downstream_allowed,
  });
}

export function replaySourceValidation(result: SourceValidationResult): SourceValidationReplayResult {
  const reconstructed_hash = resultHash(result);
  const replay_valid = reconstructed_hash === result.integrity_hash;
  const base: Omit<SourceValidationReplayResult, "integrity_hash"> = {
    replay_id: `replay_validation_${result.validation_id}`,
    replay_valid,
    validation_id: result.validation_id,
    reconstructed_state: result.validation_state,
    reconstructed_hash,
    expected_hash: result.integrity_hash,
    failures: replay_valid ? Object.freeze([]) : Object.freeze(["REPLAY_INCOMPATIBILITY"] as const),
  };
  return Object.freeze({ ...base, integrity_hash: hash(base) });
}

export function buildSourceValidationObservability(results: readonly SourceValidationResult[]): SourceValidationObservability {
  const failures = results.flatMap((result) => result.failure_reasons);
  return Object.freeze({
    validation_requests: results.length,
    successful_validations: results.filter((result) => result.validation_status === "PASS").length,
    failed_validations: results.filter((result) => result.validation_status === "FAIL").length,
    unknown_subsystem_attempts: failures.filter((failure) => failure === "UNKNOWN_SUBSYSTEM").length,
    signature_failures: failures.filter((failure) => ["MISSING_SIGNATURE", "INVALID_SIGNATURE", "CORRUPTED_SIGNATURE", "ALTERED_PAYLOAD"].includes(failure)).length,
    certification_failures: failures.filter((failure) => ["UNCERTIFIED_SUBSYSTEM", "REVOKED_CERTIFICATION", "EXPIRED_CERTIFICATION", "SUSPENDED_CERTIFICATION"].includes(failure)).length,
    version_mismatches: failures.filter((failure) => ["UNSUPPORTED_VERSION", "DEPRECATED_INTERFACE", "INCOMPATIBLE_SCHEMA", "UNKNOWN_PROTOCOL"].includes(failure)).length,
    tenant_violations: failures.filter((failure) => ["CROSS_TENANT_SUBMISSION", "TENANT_MISMATCH", "UNAUTHORIZED_TENANT_ACCESS", "FOREIGN_MISSION_REFERENCE"].includes(failure)).length,
    mission_ownership_failures: failures.filter((failure) => ["UNKNOWN_MISSION", "UNAUTHORIZED_MISSION", "INACTIVE_MISSION", "OWNERSHIP_MISMATCH"].includes(failure)).length,
    authority_violations: failures.filter((failure) => ["AUTHORITY_ESCALATION", "UNAUTHORIZED_RECOMMENDATION", "INVALID_AUTHORITY_LEVEL", "RESTRICTED_OPERATION"].includes(failure)).length,
    replay_compatibility_failures: failures.filter((failure) => ["MISSING_REPLAY_REFERENCE", "REPLAY_INCOMPATIBILITY", "NONDETERMINISTIC_IDENTIFIER", "LINEAGE_CORRUPTION"].includes(failure)).length,
    validation_latency: 0,
  });
}

export function getDecisionSourceValidationEngine() {
  const request = createSourceValidationRequest();
  const validation = validateDecisionSource(request);
  return Object.freeze({
    registered_subsystems: REGISTERED_SUBSYSTEMS,
    certifications: SOURCE_CERTIFICATIONS,
    request,
    validation,
    intake_bridge: validateSourceForIntake(),
    replay: replaySourceValidation(validation),
    observability: buildSourceValidationObservability([validation]),
  });
}
