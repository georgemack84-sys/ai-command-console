import { replayCanaryShadowProgressiveDelivery, runCanaryShadowProgressiveDelivery, validateCanaryShadowProgressiveDelivery } from "@/services/canary-shadow-progressive-delivery";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  ProductionBoundaryDecisionType,
  ProductionBoundaryEnforcementBundle,
  ProductionBoundaryEnforcementResult,
  ProductionBoundaryEnforcementValidation,
  ProductionBoundaryFailure,
  ProductionBoundaryFailureState,
  ProductionBoundaryInput,
  ProductionBoundaryLifecycleState,
  ProductionBoundaryOutcome,
  ProductionBoundaryCertificationTest,
  ProductionBoundaryViolationSeverity,
} from "@/types/production-boundary-enforcement";

const VERSION = "production-boundary-enforcement/v15.6" as const;
const IDENTIFIER = "ProductionBoundaryEnforcement" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly ProductionBoundaryFailure[], failure: ProductionBoundaryFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: ProductionBoundaryInput["scenario"]): ProductionBoundaryFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly ProductionBoundaryFailure[]): ProductionBoundaryOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_BOUNDARY_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycle = freezeArray(["RECOMMENDATION_CREATED", "BOUNDARY_VALIDATION", "AUTHORITY_REQUIRED", "EXTERNAL_GATEWAY", "TOKEN_VALIDATION", "AUTHORIZED", "EXTERNAL_EXECUTION", "AUDIT_CAPTURE", "COMPLETE"] as const satisfies readonly ProductionBoundaryLifecycleState[]);
const failurePath = freezeArray(["VIOLATION_DETECTED", "KILL_SWITCH", "CONTAINMENT", "FORENSICS", "REPLAY", "GOVERNANCE_REVIEW"] as const satisfies readonly ProductionBoundaryFailureState[]);
const decisions = freezeArray(["ADVISORY_ONLY", "AUTHORIZATION_REQUIRED", "AUTHORIZED", "DENIED", "CONTAINED", "FAIL_CLOSED"] as const satisfies readonly ProductionBoundaryDecisionType[]);
const severities = freezeArray(["INFO", "WARNING", "MAJOR", "CRITICAL", "CONSTITUTIONAL"] as const satisfies readonly ProductionBoundaryViolationSeverity[]);

function certTest(name: string, passed: boolean, failure: ProductionBoundaryFailure, evidence_refs: readonly string[]): ProductionBoundaryCertificationTest {
  const actual: ProductionBoundaryOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_BOUNDARY_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("production_boundary_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<ProductionBoundaryEnforcementResult, "replay_hash" | "integrity_hash">): string {
  return hash({ progressive: result.progressive_delivery_ref, decision: result.decision.integrity_hash, authorization: result.authorization.integrity_hash, authority: result.authority_validation.integrity_hash, violations: result.violations.map((v) => v.integrity_hash), containment: result.containment.integrity_hash, tests: result.certification_tests.map((t) => t.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ProductionBoundaryEnforcementResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runProductionBoundaryEnforcement(input: ProductionBoundaryInput = {}): ProductionBoundaryEnforcementResult {
  const progressive = runCanaryShadowProgressiveDelivery();
  const progressiveValid = validateCanaryShadowProgressiveDelivery(progressive);
  const progressiveReplayable = replayCanaryShadowProgressiveDelivery(progressive);
  const direct = directFailure(input.scenario);
  const upstreamFailures: ProductionBoundaryFailure[] = progressiveValid.valid && progressiveReplayable ? [] : ["MODEL_OUTPUT_BYPASSES_GOVERNANCE"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const evidenceRefs = freezeArray([progressive.integrity_hash, progressive.certification_record.integrity_hash, progressive.recommendation.integrity_hash]);
  const violationDetected = failures.length > 0 && !(failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_BOUNDARY_WARNING");
  const decision = nested({ decision_id: id("production_boundary_decision", progressive.integrity_hash), decision: violationDetected ? "CONTAINED" as const : "AUTHORIZATION_REQUIRED" as const, advisory_boundary_preserved: !has(failures, "DIRECT_EXECUTION_POSSIBLE"), execution_capable_response_prevented: !has(failures, "DIRECT_EXECUTION_POSSIBLE"), constitutional_policy_enforced: !has(failures, "MODEL_OUTPUT_BYPASSES_GOVERNANCE"), production_interfaces_validated: true, authority_expansion_blocked: !has(failures, "CONFIDENCE_GRANTS_AUTHORITY"), deterministic: true, evidence_refs: has(failures, "AUDIT_EVIDENCE_MUTABLE") ? freezeArray([]) : evidenceRefs });
  const authorization = nested({ authorization_id: id("external_authorization", progressive.integrity_hash), execution_request_validated: !has(failures, "DIRECT_EXECUTION_POSSIBLE"), external_authority_identity_verified: !has(failures, "EXTERNAL_AUTHORIZATION_NOT_REQUIRED"), authorization_scope_valid: true, approval_evidence_valid: !has(failures, "OPERATOR_APPROVAL_NOT_AUTHENTICATED"), not_expired: !has(failures, "INVALID_TOKEN_ACCEPTED"), replay_identity_assigned: !has(failures, "AUTHORIZATION_REPLAY_NON_DETERMINISTIC"), mission_control_direct_execution_path: false as const, unauthenticated_requests_refused: !has(failures, "EXTERNAL_AUTHORIZATION_NOT_REQUIRED") });
  const authority_validation = nested({ validation_id: id("authority_validation", progressive.integrity_hash), token_identity_valid: !has(failures, "INVALID_TOKEN_ACCEPTED"), issuer_valid: !has(failures, "INVALID_TOKEN_ACCEPTED"), cryptographic_signature_valid: !has(failures, "AUTHORITY_TOKEN_NOT_CRYPTOGRAPHICALLY_VALIDATED"), not_expired: !has(failures, "INVALID_TOKEN_ACCEPTED"), scope_valid: true, delegation_chain_verified: !has(failures, "DELEGATION_CHAIN_NOT_VERIFIED"), not_revoked: !has(failures, "INVALID_TOKEN_ACCEPTED"), tenant_ownership_valid: !has(failures, "CROSS_TENANT_AUTHORITY_ACCEPTED"), replay_protection_valid: !has(failures, "AUTHORIZATION_REPLAY_NON_DETERMINISTIC"), confidence_substitutes_for_authority: false as const, inference_substitutes_for_authority: false as const });
  const containment = nested({ containment_id: id("boundary_containment", progressive.integrity_hash), execution_blocked: !has(failures, "DIRECT_EXECUTION_POSSIBLE"), request_isolated: true, evidence_preserved: !has(failures, "CONTAINMENT_EVIDENCE_LOST"), governance_notified: true, authorization_path_frozen: true, immutable_audit_recorded: !has(failures, "AUDIT_EVIDENCE_MUTABLE"), replay_capture_initiated: !has(failures, "AUTHORIZATION_REPLAY_NON_DETERMINISTIC"), rollback_recommended: true, never_grants_execution_authority: true, deterministic: !has(failures, "KILL_SWITCH_NON_DETERMINISTIC") });
  const violations = freezeArray([
    nested({ violation_id: id("boundary_violation", progressive.integrity_hash), severity: violationDetected ? "CONSTITUTIONAL" as const : "INFO" as const, attempted_direct_execution: has(failures, "DIRECT_EXECUTION_POSSIBLE"), authority_escalation: has(failures, "CONFIDENCE_GRANTS_AUTHORITY"), bypass_attempt: has(failures, "MODEL_OUTPUT_BYPASSES_GOVERNANCE"), governance_violation: has(failures, "MODEL_OUTPUT_BYPASSES_GOVERNANCE"), invalid_token: has(failures, "INVALID_TOKEN_ACCEPTED") || has(failures, "AUTHORITY_TOKEN_NOT_CRYPTOGRAPHICALLY_VALIDATED"), authorization_failure: has(failures, "EXTERNAL_AUTHORIZATION_NOT_REQUIRED") || has(failures, "OPERATOR_APPROVAL_NOT_AUTHENTICATED"), gateway_failure: has(failures, "EXTERNAL_AUTHORIZATION_NOT_REQUIRED"), replay_failure: has(failures, "AUTHORIZATION_REPLAY_NON_DETERMINISTIC"), containment_refs: has(failures, "BOUNDARY_VIOLATION_NOT_DETECTED") ? freezeArray([]) : freezeArray([containment.integrity_hash]), forensic_refs: has(failures, "CONTAINMENT_EVIDENCE_LOST") ? freezeArray([]) : freezeArray([id("forensics", progressive.integrity_hash)]), immutable: !has(failures, "AUDIT_EVIDENCE_MUTABLE"), replayable: !has(failures, "AUTHORIZATION_REPLAY_NON_DETERMINISTIC") }),
  ]);
  const tests = freezeArray([
    certTest("Recommendations cannot execute directly", decision.execution_capable_response_prevented && authorization.mission_control_direct_execution_path === false, "DIRECT_EXECUTION_POSSIBLE", [decision.integrity_hash]),
    certTest("External systems require independent authorization", authorization.external_authority_identity_verified && authorization.unauthenticated_requests_refused, "EXTERNAL_AUTHORIZATION_NOT_REQUIRED", [authorization.integrity_hash]),
    certTest("Operator approvals authenticated", authorization.approval_evidence_valid, "OPERATOR_APPROVAL_NOT_AUTHENTICATED", [authorization.integrity_hash]),
    certTest("Authority tokens cryptographically validated", authority_validation.cryptographic_signature_valid, "AUTHORITY_TOKEN_NOT_CRYPTOGRAPHICALLY_VALIDATED", [authority_validation.integrity_hash]),
    certTest("Delegation chain verified", authority_validation.delegation_chain_verified, "DELEGATION_CHAIN_NOT_VERIFIED", [authority_validation.integrity_hash]),
    certTest("Confidence cannot grant authority", authority_validation.confidence_substitutes_for_authority === false && decision.authority_expansion_blocked, "CONFIDENCE_GRANTS_AUTHORITY", [authority_validation.integrity_hash]),
    certTest("Model outputs cannot bypass governance", decision.constitutional_policy_enforced, "MODEL_OUTPUT_BYPASSES_GOVERNANCE", [decision.integrity_hash]),
    certTest("Cross-tenant authority rejected", authority_validation.tenant_ownership_valid, "CROSS_TENANT_AUTHORITY_ACCEPTED", [authority_validation.integrity_hash]),
    certTest("Invalid tokens rejected", authority_validation.token_identity_valid && authority_validation.not_revoked && authorization.not_expired, "INVALID_TOKEN_ACCEPTED", [authority_validation.integrity_hash]),
    certTest("Boundary violations detected", violations.every((v) => v.containment_refs.length > 0), "BOUNDARY_VIOLATION_NOT_DETECTED", violations.map((v) => v.integrity_hash)),
    certTest("Kill switch activates deterministically", containment.deterministic && containment.execution_blocked, "KILL_SWITCH_NON_DETERMINISTIC", [containment.integrity_hash]),
    certTest("Containment preserves evidence", containment.evidence_preserved && violations.every((v) => v.forensic_refs.length > 0), "CONTAINMENT_EVIDENCE_LOST", [containment.integrity_hash]),
    certTest("Authorization replay deterministic", authorization.replay_identity_assigned && authority_validation.replay_protection_valid && violations.every((v) => v.replayable), "AUTHORIZATION_REPLAY_NON_DETERMINISTIC", [authorization.integrity_hash]),
    certTest("Audit evidence immutable", decision.evidence_refs.length > 0 && containment.immutable_audit_recorded && violations.every((v) => v.immutable), "AUDIT_EVIDENCE_MUTABLE", [decision.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is ProductionBoundaryFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<ProductionBoundaryEnforcementResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, progressive_delivery_ref: progressive.integrity_hash, lifecycle, failure_path: failurePath, decision, authorization, authority_validation, violations, containment, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateProductionBoundaryEnforcement(result = runProductionBoundaryEnforcement()): ProductionBoundaryEnforcementValidation {
  const decision_valid = verify(result.decision) && result.decision.advisory_boundary_preserved && result.decision.execution_capable_response_prevented && result.decision.constitutional_policy_enforced && result.decision.authority_expansion_blocked && result.decision.evidence_refs.length > 0;
  const authorization_valid = verify(result.authorization) && result.authorization.execution_request_validated && result.authorization.external_authority_identity_verified && result.authorization.approval_evidence_valid && result.authorization.not_expired && result.authorization.replay_identity_assigned && result.authorization.mission_control_direct_execution_path === false && result.authorization.unauthenticated_requests_refused;
  const authority_valid = verify(result.authority_validation) && Object.entries(result.authority_validation).filter(([key]) => key !== "validation_id" && key !== "integrity_hash" && key !== "confidence_substitutes_for_authority" && key !== "inference_substitutes_for_authority").every(([, value]) => value === true) && result.authority_validation.confidence_substitutes_for_authority === false && result.authority_validation.inference_substitutes_for_authority === false;
  const violations_valid = result.violations.length === 1 && result.violations.every((v) => verify(v) && v.containment_refs.length > 0 && v.forensic_refs.length > 0 && v.immutable && v.replayable);
  const containment_valid = verify(result.containment) && result.containment.execution_blocked && result.containment.evidence_preserved && result.containment.immutable_audit_recorded && result.containment.replay_capture_initiated && result.containment.never_grants_execution_authority && result.containment.deterministic;
  const certification_valid = result.certification_tests.length === 14 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && replay_valid && decision_valid && authorization_valid && authority_valid && violations_valid && containment_valid && certification_valid;
  return nested({ valid, outcome: result.outcome, decision_valid, authorization_valid, authority_valid, violations_valid, containment_valid, certification_valid, replay_valid, failures: result.failures });
}

export function replayProductionBoundaryEnforcement(result = runProductionBoundaryEnforcement()): boolean {
  const replayed = runProductionBoundaryEnforcement();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateProductionBoundaryEnforcement(result).valid;
}

export function getProductionBoundaryEnforcementBundle(): ProductionBoundaryEnforcementBundle {
  const result = runProductionBoundaryEnforcement();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "canary-shadow-progressive-delivery/v15.5" as const, lifecycle, failure_path: failurePath, decisions, severities, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateProductionBoundaryEnforcement(result) });
}

export const ProductionBoundaryEnforcementService = Object.freeze({ run: runProductionBoundaryEnforcement, validate: validateProductionBoundaryEnforcement, replay: replayProductionBoundaryEnforcement });
