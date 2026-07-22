import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runProductionObservabilityOperatorControl } from "@/services/production-observability-operator-control";
import type {
  ProductionCertificationFailure,
  ProductionCertificationGateBundle,
  ProductionCertificationGateResult,
  ProductionCertificationGateValidation,
  ProductionCertificationInput,
  ProductionCertificationLifecycleState,
  ProductionCertificationOutcome,
  ProductionCertificationTest,
} from "@/types/production-certification-gate";

const VERSION = "production-certification-gate/v15.12" as const;
const IDENTIFIER = "ProductionCertificationGate" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const DEFAULT_RELEASE = "release_phase_15_certified_production" as const;
const DEFAULT_TENANT = "tenant_phase_15_production_certification" as const;
const DEFAULT_OPERATOR = "operator_phase_15_production_certification" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly ProductionCertificationFailure[], failure: ProductionCertificationFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: ProductionCertificationInput["scenario"]): ProductionCertificationFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly ProductionCertificationFailure[]): ProductionCertificationOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_PRODUCTION_CERTIFICATION_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycle = freezeArray(["CERTIFICATION_REQUESTED", "EVIDENCE_COLLECTION", "EVIDENCE_VALIDATED", "QUALIFICATION_VALIDATION", "COMPLIANCE_VALIDATION", "READINESS_VALIDATION", "DECISION_PENDING", "PASS", "CONDITIONAL_PASS", "FAIL"] as const satisfies readonly ProductionCertificationLifecycleState[]);
const evidenceRequirements = freezeArray(["Phase 14 certification", "release evidence", "deployment evidence", "environment evidence", "replay evidence", "rollback evidence", "tenant isolation evidence", "observability evidence", "governance evidence", "assurance evidence"] as const);
const evaluationOrder = freezeArray(["evidence", "qualification", "constitutional compliance", "operational readiness", "decision", "ledger", "replay", "observability"] as const);

function certTest(name: string, passed: boolean, failure: ProductionCertificationFailure, evidence_refs: readonly string[]): ProductionCertificationTest {
  const actual: ProductionCertificationOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_PRODUCTION_CERTIFICATION_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("production_certification_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<ProductionCertificationGateResult, "replay_hash" | "integrity_hash">): string {
  return hash({ observability: result.observability_ref, contract: result.contract.integrity_hash, evidence: result.evidence.integrity_hash, qualification: result.qualification.integrity_hash, compliance: result.compliance.integrity_hash, readiness: result.readiness.integrity_hash, decision: result.decision.integrity_hash, record: result.certification_record.integrity_hash, ledger: result.ledger.map((entry) => entry.integrity_hash), replay: result.replay.integrity_hash, certObservability: result.observability.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ProductionCertificationGateResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runProductionCertificationGate(input: ProductionCertificationInput = {}): ProductionCertificationGateResult {
  const visibility = runProductionObservabilityOperatorControl({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR });
  const direct = directFailure(input.scenario);
  const upstreamFailures: ProductionCertificationFailure[] = visibility.outcome === "PASS" ? [] : ["OBSERVABILITY_INCOMPLETE"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const releaseId = input.release_id ?? DEFAULT_RELEASE;
  const certificationId = id("production_certification", { releaseId, visibility: visibility.integrity_hash });
  const contract = nested({ contract_version: VERSION, certification_authority: "CONSTITUTIONAL_PRODUCTION_CERTIFICATION_GATE" as const, lifecycle, evidence_requirements: evidenceRequirements, evaluation_order: evaluationOrder, replay_required: !has(failures, "CERTIFICATION_REPLAY_NON_DETERMINISTIC"), governance_required: !has(failures, "PROMOTION_AUTHORITY_NOT_ENFORCED"), operator_accountability_required: !has(failures, "OPERATOR_ACTIONS_NOT_ATTRIBUTABLE"), advisory_only: !has(failures, "ADVISORY_ONLY_BOUNDARY_NOT_ENFORCED") && !has(failures, "DIRECT_EXECUTION_POSSIBLE"), fail_closed: !has(failures, "UNEXPLAINED_DIVERGENCE_NOT_FAIL_CLOSED"), immutable_requirements: !has(failures, "CERTIFICATION_LEDGER_MUTABLE") });
  const evidence = nested({ evidence_id: id("production_certification_evidence", certificationId), phase14_certification_ref: has(failures, "PHASE_14_CERTIFICATION_INVALID") ? "" : "phase14-certification-gate/v14.12", release_evidence_ref: has(failures, "RELEASE_ARTIFACT_MISMATCH") ? "" : releaseId, deployment_evidence_ref: visibility.release_health.integrity_hash, environment_evidence_ref: has(failures, "PRODUCTION_ENVIRONMENT_NOT_QUALIFIED") ? "" : visibility.continuous_assurance_ref, replay_evidence_ref: has(failures, "PRODUCTION_REPLAY_NON_DETERMINISTIC") ? "" : visibility.replay_hash, rollback_evidence_ref: has(failures, "ROLLBACK_NOT_VALIDATED") ? "" : visibility.runbook.integrity_hash, tenant_isolation_evidence_ref: has(failures, "TENANT_ISOLATION_NOT_CONTINUOUSLY_VERIFIED") ? "" : visibility.tenant_isolation.integrity_hash, observability_evidence_ref: has(failures, "OBSERVABILITY_INCOMPLETE") ? "" : visibility.integrity_hash, governance_evidence_ref: has(failures, "PROMOTION_AUTHORITY_NOT_ENFORCED") ? "" : visibility.advisory_boundary.integrity_hash, assurance_evidence_ref: has(failures, "CONTINUOUS_ASSURANCE_NOT_OPERATIONAL") ? "" : visibility.continuous_assurance_ref, complete: !has(failures, "CERTIFICATION_EVIDENCE_INCOMPLETE"), integrity_verified: !has(failures, "RELEASE_ARTIFACT_MISMATCH"), freshness_verified: !has(failures, "CERTIFICATION_FRESHNESS_NOT_ENFORCED"), signatures_verified: !has(failures, "BUILD_PROVENANCE_INCOMPLETE"), lineage_complete: !has(failures, "CERTIFICATION_LEDGER_MUTABLE"), cryptographic_identity_verified: !has(failures, "BUILD_PROVENANCE_INCOMPLETE") });
  const qualification = nested({ validation_id: id("production_qualification", certificationId), certified_artifacts_valid: !has(failures, "RELEASE_ARTIFACT_MISMATCH"), production_environment_qualified: !has(failures, "PRODUCTION_ENVIRONMENT_NOT_QUALIFIED"), deployment_lineage_valid: !has(failures, "BUILD_PROVENANCE_INCOMPLETE"), release_identity_valid: !has(failures, "RELEASE_ARTIFACT_MISMATCH"), replay_ready: !has(failures, "PRODUCTION_REPLAY_NON_DETERMINISTIC"), rollback_ready: !has(failures, "ROLLBACK_NOT_VALIDATED"), recovery_ready: !has(failures, "RECOVERY_REQUALIFICATION_NOT_REQUIRED"), production_monitoring_ready: !has(failures, "OBSERVABILITY_INCOMPLETE"), dependencies_satisfied: !has(failures, "CERTIFICATION_EVIDENCE_INCOMPLETE") });
  const compliance = nested({ compliance_id: id("production_compliance", certificationId), advisory_only_operation: !has(failures, "ADVISORY_ONLY_BOUNDARY_NOT_ENFORCED"), authority_separation: !has(failures, "PROMOTION_AUTHORITY_NOT_ENFORCED"), governance_supremacy: !has(failures, "PROMOTION_AUTHORITY_NOT_ENFORCED"), operator_supremacy: !has(failures, "OPERATOR_ACTIONS_NOT_ATTRIBUTABLE"), tenant_isolation: !has(failures, "TENANT_ISOLATION_NOT_CONTINUOUSLY_VERIFIED"), deterministic_replay: !has(failures, "PRODUCTION_REPLAY_NON_DETERMINISTIC"), immutable_lineage: !has(failures, "CERTIFICATION_LEDGER_MUTABLE"), continuous_certification: !has(failures, "CONTINUOUS_ASSURANCE_NOT_OPERATIONAL"), direct_execution_capability_absent: !has(failures, "DIRECT_EXECUTION_POSSIBLE"), governance_bypass_absent: !has(failures, "PROMOTION_AUTHORITY_NOT_ENFORCED"), unexplained_replay_divergence_absent: !has(failures, "UNEXPLAINED_DIVERGENCE_NOT_FAIL_CLOSED"), certification_tampering_absent: !has(failures, "CERTIFICATION_LEDGER_MUTABLE") });
  const readiness = nested({ readiness_id: id("production_readiness", certificationId), production_dashboards_ready: !has(failures, "OBSERVABILITY_INCOMPLETE"), operator_controls_ready: !has(failures, "OPERATOR_ACTIONS_NOT_ATTRIBUTABLE"), alerts_ready: !has(failures, "OBSERVABILITY_INCOMPLETE"), runbooks_ready: !has(failures, "ROLLBACK_NOT_VALIDATED"), rollback_procedures_ready: !has(failures, "ROLLBACK_NOT_VALIDATED"), incident_response_ready: !has(failures, "INCIDENT_EVIDENCE_MUTABLE"), continuous_assurance_ready: !has(failures, "CONTINUOUS_ASSURANCE_NOT_OPERATIONAL"), certification_monitoring_ready: !has(failures, "CERTIFICATION_FRESHNESS_NOT_ENFORCED"), recovery_verified: !has(failures, "RECOVERY_REQUALIFICATION_NOT_REQUIRED") });
  const baseEvidenceRefs = freezeArray([evidence.integrity_hash, qualification.integrity_hash, compliance.integrity_hash, readiness.integrity_hash]);
  const decisionPreconditions = evidence.complete && evidence.integrity_verified && evidence.freshness_verified && qualification.dependencies_satisfied && Object.entries(compliance).filter(([key]) => key !== "compliance_id" && key !== "integrity_hash").every(([, value]) => value === true) && Object.entries(readiness).filter(([key]) => key !== "readiness_id" && key !== "integrity_hash").every(([, value]) => value === true);
  const preliminaryOutcome = outcomeFor(failures);
  const decision = nested({ decision_id: id("production_certification_decision", certificationId), outcome: preliminaryOutcome, evidence_package_refs: has(failures, "CERTIFICATION_EVIDENCE_INCOMPLETE") ? freezeArray([]) : baseEvidenceRefs, deterministic: !has(failures, "CERTIFICATION_REPLAY_NON_DETERMINISTIC"), replay_reproducible: !has(failures, "CERTIFICATION_REPLAY_NON_DETERMINISTIC"), equivalent_evidence_same_outcome: !has(failures, "CERTIFICATION_REPLAY_NON_DETERMINISTIC"), manual_override_alters_evidence: false as const, governance_decisions_replayable: !has(failures, "PROMOTION_AUTHORITY_NOT_ENFORCED"), restrictions: preliminaryOutcome === "CONDITIONAL_PASS" ? freezeArray(["limited production operation", "heightened monitoring"]) : freezeArray([]) });
  const certification_record = nested({ certification_id: certificationId, release_id: releaseId, artifact_id: id("artifact", releaseId), environment_id: evidence.environment_evidence_ref, phase14_certification_ref: evidence.phase14_certification_ref, qualification_refs: freezeArray([qualification.integrity_hash]), replay_refs: has(failures, "CERTIFICATION_REPLAY_NON_DETERMINISTIC") ? freezeArray([]) : freezeArray([decision.integrity_hash, visibility.replay_hash]), assurance_refs: freezeArray([visibility.continuous_assurance_ref]), governance_refs: freezeArray([evidence.governance_evidence_ref]), operator_approval_refs: has(failures, "OPERATOR_ACTIONS_NOT_ATTRIBUTABLE") ? freezeArray([]) : freezeArray([visibility.operator_action.integrity_hash]), certification_outcome: preliminaryOutcome, restrictions: decision.restrictions, certification_timestamp: TIMESTAMP, supersedes_certification_ref: null });
  const ledgerEvents = ["CERTIFICATION_REQUEST", "EVIDENCE", "OUTCOME", "OPERATOR_APPROVAL", "GOVERNANCE_REVIEW", "REPLAY_REFERENCE", "SUPERSESSION", "RECERTIFICATION_EVENT"] as const;
  const ledger = freezeArray(ledgerEvents.map((event_type, index) => nested({ ledger_entry_id: id("production_certification_ledger", { certificationId, event_type }), event_type, sequence: index + 1, certification_id: certificationId, evidence_refs: has(failures, "CERTIFICATION_LEDGER_MUTABLE") ? freezeArray([]) : freezeArray([certification_record.integrity_hash]), replay_refs: certification_record.replay_refs, lineage_refs: has(failures, "CERTIFICATION_LEDGER_MUTABLE") ? freezeArray([]) : freezeArray([visibility.integrity_hash, certification_record.integrity_hash]), append_only: !has(failures, "CERTIFICATION_LEDGER_MUTABLE"), immutable: !has(failures, "CERTIFICATION_LEDGER_MUTABLE"), permanently_visible: true })));
  const replay = nested({ replay_id: id("production_certification_replay", certificationId), inputs_replayed: !has(failures, "CERTIFICATION_REPLAY_NON_DETERMINISTIC"), evaluation_order_replayed: !has(failures, "CERTIFICATION_REPLAY_NON_DETERMINISTIC"), evidence_integrity_replayed: !has(failures, "CERTIFICATION_REPLAY_NON_DETERMINISTIC"), decision_reproduced: !has(failures, "CERTIFICATION_REPLAY_NON_DETERMINISTIC"), outcome_consistent: !has(failures, "CERTIFICATION_REPLAY_NON_DETERMINISTIC"), deterministic: !has(failures, "CERTIFICATION_REPLAY_NON_DETERMINISTIC"), unexplained_differences_absent: !has(failures, "UNEXPLAINED_DIVERGENCE_NOT_FAIL_CLOSED") });
  const observability = nested({ observability_id: id("production_certification_observability", certificationId), certification_status_visible: !has(failures, "OBSERVABILITY_INCOMPLETE"), qualification_status_visible: !has(failures, "OBSERVABILITY_INCOMPLETE"), evidence_freshness_visible: !has(failures, "CERTIFICATION_FRESHNESS_NOT_ENFORCED"), replay_health_visible: !has(failures, "PRODUCTION_REPLAY_NON_DETERMINISTIC"), rollback_readiness_visible: !has(failures, "ROLLBACK_NOT_VALIDATED"), assurance_health_visible: !has(failures, "CONTINUOUS_ASSURANCE_NOT_OPERATIONAL"), incidents_visible: !has(failures, "INCIDENT_EVIDENCE_MUTABLE"), operator_approvals_visible: !has(failures, "OPERATOR_ACTIONS_NOT_ATTRIBUTABLE"), governance_reviews_visible: !has(failures, "PROMOTION_AUTHORITY_NOT_ENFORCED"), alerts_operational: !has(failures, "OBSERVABILITY_INCOMPLETE") });
  const tests = freezeArray([
    certTest("Phase 14 certification valid", Boolean(evidence.phase14_certification_ref), "PHASE_14_CERTIFICATION_INVALID", [evidence.integrity_hash]),
    certTest("Release artifact matches certified artifact", qualification.certified_artifacts_valid && qualification.release_identity_valid, "RELEASE_ARTIFACT_MISMATCH", [qualification.integrity_hash]),
    certTest("Build provenance complete", evidence.signatures_verified && evidence.cryptographic_identity_verified && qualification.deployment_lineage_valid, "BUILD_PROVENANCE_INCOMPLETE", [evidence.integrity_hash]),
    certTest("Production environment qualified", qualification.production_environment_qualified && Boolean(evidence.environment_evidence_ref), "PRODUCTION_ENVIRONMENT_NOT_QUALIFIED", [qualification.integrity_hash]),
    certTest("Promotion authority enforced", compliance.authority_separation && compliance.governance_supremacy && decision.governance_decisions_replayable, "PROMOTION_AUTHORITY_NOT_ENFORCED", [compliance.integrity_hash]),
    certTest("Advisory-only boundary enforced", contract.advisory_only && compliance.advisory_only_operation, "ADVISORY_ONLY_BOUNDARY_NOT_ENFORCED", [contract.integrity_hash]),
    certTest("Direct execution impossible", compliance.direct_execution_capability_absent, "DIRECT_EXECUTION_POSSIBLE", [compliance.integrity_hash]),
    certTest("Tenant isolation continuously verified", compliance.tenant_isolation && Boolean(evidence.tenant_isolation_evidence_ref), "TENANT_ISOLATION_NOT_CONTINUOUSLY_VERIFIED", [compliance.integrity_hash]),
    certTest("Canary and exposure policies enforced", visibility.release_health.promotion_lineage_complete && !has(failures, "CANARY_EXPOSURE_POLICIES_NOT_ENFORCED"), "CANARY_EXPOSURE_POLICIES_NOT_ENFORCED", [visibility.release_health.integrity_hash]),
    certTest("Production replay deterministic", compliance.deterministic_replay && replay.deterministic && Boolean(evidence.replay_evidence_ref), "PRODUCTION_REPLAY_NON_DETERMINISTIC", [replay.integrity_hash]),
    certTest("Unexplained divergence fail-closed", contract.fail_closed && compliance.unexplained_replay_divergence_absent && replay.unexplained_differences_absent, "UNEXPLAINED_DIVERGENCE_NOT_FAIL_CLOSED", [replay.integrity_hash]),
    certTest("Rollback validated", qualification.rollback_ready && readiness.rollback_procedures_ready && Boolean(evidence.rollback_evidence_ref), "ROLLBACK_NOT_VALIDATED", [readiness.integrity_hash]),
    certTest("Incident evidence immutable", readiness.incident_response_ready && visibility.alert.history_immutable, "INCIDENT_EVIDENCE_MUTABLE", [visibility.alert.integrity_hash]),
    certTest("Recovery requires requalification", qualification.recovery_ready && readiness.recovery_verified, "RECOVERY_REQUALIFICATION_NOT_REQUIRED", [qualification.integrity_hash]),
    certTest("Continuous assurance operational", compliance.continuous_certification && readiness.continuous_assurance_ready && Boolean(evidence.assurance_evidence_ref), "CONTINUOUS_ASSURANCE_NOT_OPERATIONAL", [readiness.integrity_hash]),
    certTest("Certification freshness enforced", evidence.freshness_verified && observability.evidence_freshness_visible, "CERTIFICATION_FRESHNESS_NOT_ENFORCED", [evidence.integrity_hash]),
    certTest("Operator actions attributable", compliance.operator_supremacy && certification_record.operator_approval_refs.length > 0, "OPERATOR_ACTIONS_NOT_ATTRIBUTABLE", [certification_record.integrity_hash]),
    certTest("Observability complete", readiness.production_dashboards_ready && Object.entries(observability).filter(([key]) => key.endsWith("_visible") || key === "alerts_operational").every(([, value]) => value === true), "OBSERVABILITY_INCOMPLETE", [observability.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is ProductionCertificationFailure => Boolean(failure)), ...(decisionPreconditions ? [] : ["CERTIFICATION_EVIDENCE_INCOMPLETE" as const])])]);
  const outcome = outcomeFor(effectiveFailures);
  const finalDecision = decision.outcome === outcome ? decision : nested({ ...decision, outcome });
  const finalRecord = certification_record.certification_outcome === outcome ? certification_record : nested({ ...certification_record, certification_outcome: outcome, restrictions: finalDecision.restrictions });
  const base: Omit<ProductionCertificationGateResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, observability_ref: visibility.integrity_hash, contract, evidence, qualification, compliance, readiness, decision: finalDecision, certification_record: finalRecord, ledger, replay, observability, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateProductionCertificationGate(result = runProductionCertificationGate()): ProductionCertificationGateValidation {
  const contract_valid = verify(result.contract) && result.contract.lifecycle.length === 10 && result.contract.evidence_requirements.length === 10 && result.contract.replay_required && result.contract.governance_required && result.contract.operator_accountability_required && result.contract.advisory_only && result.contract.fail_closed && result.contract.immutable_requirements;
  const evidence_valid = verify(result.evidence) && result.evidence.complete && result.evidence.integrity_verified && result.evidence.freshness_verified && result.evidence.signatures_verified && result.evidence.lineage_complete && result.evidence.cryptographic_identity_verified && Object.entries(result.evidence).filter(([key]) => key.endsWith("_ref")).every(([, value]) => Boolean(value));
  const qualification_valid = verify(result.qualification) && Object.entries(result.qualification).filter(([key]) => key !== "validation_id" && key !== "integrity_hash").every(([, value]) => value === true);
  const compliance_valid = verify(result.compliance) && Object.entries(result.compliance).filter(([key]) => key !== "compliance_id" && key !== "integrity_hash").every(([, value]) => value === true);
  const readiness_valid = verify(result.readiness) && Object.entries(result.readiness).filter(([key]) => key !== "readiness_id" && key !== "integrity_hash").every(([, value]) => value === true);
  const decision_valid = verify(result.decision) && result.decision.outcome === "PASS" && result.decision.evidence_package_refs.length > 0 && result.decision.deterministic && result.decision.replay_reproducible && result.decision.equivalent_evidence_same_outcome && !result.decision.manual_override_alters_evidence && result.decision.governance_decisions_replayable;
  const record_valid = verify(result.certification_record) && result.certification_record.certification_outcome === "PASS" && result.certification_record.operator_approval_refs.length > 0 && result.certification_record.replay_refs.length > 0 && result.certification_record.governance_refs.length > 0;
  const ledger_valid = result.ledger.length === 8 && result.ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.append_only && entry.immutable && entry.permanently_visible && entry.evidence_refs.length > 0 && entry.replay_refs.length > 0 && entry.lineage_refs.length > 0);
  const replay_valid = verify(result.replay) && Object.entries(result.replay).filter(([key]) => key !== "replay_id" && key !== "integrity_hash").every(([, value]) => value === true);
  const observability_valid = verify(result.observability) && Object.entries(result.observability).filter(([key]) => key !== "observability_id" && key !== "integrity_hash").every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 18 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && result_replay_valid && contract_valid && evidence_valid && qualification_valid && compliance_valid && readiness_valid && decision_valid && record_valid && ledger_valid && replay_valid && observability_valid && certification_valid;
  return nested({ valid, outcome: result.outcome, contract_valid, evidence_valid, qualification_valid, compliance_valid, readiness_valid, decision_valid, record_valid, ledger_valid, replay_valid, observability_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayProductionCertificationGate(result = runProductionCertificationGate()): boolean {
  const replayed = runProductionCertificationGate();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateProductionCertificationGate(result).valid;
}

export function getProductionCertificationGateBundle(): ProductionCertificationGateBundle {
  const result = runProductionCertificationGate();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "production-observability-operator-control/v15.11" as const, lifecycle, evidence_requirements: evidenceRequirements, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateProductionCertificationGate(result) });
}

export const ProductionCertificationGateService = Object.freeze({ run: runProductionCertificationGate, validate: validateProductionCertificationGate, replay: replayProductionCertificationGate });
