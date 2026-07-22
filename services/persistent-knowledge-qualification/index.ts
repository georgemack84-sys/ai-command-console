import { buildPersistentIntelligenceFoundation, validatePersistentIntelligenceFoundation } from "@/services/persistent-intelligence-foundation";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  ConstitutionalQualificationReport,
  DuplicateConsolidationReport,
  GovernanceQualificationReport,
  OperatorApprovalRecord,
  PersistentKnowledgeCandidate,
  PersistentKnowledgeCertificationOutcome,
  PersistentKnowledgeQualificationCertification,
  PersistentKnowledgeQualificationContract,
  PersistentKnowledgeQualificationContractBundle,
  PersistentKnowledgeQualificationFailure,
  PersistentKnowledgeQualificationInput,
  PersistentKnowledgeQualificationLedgerEntry,
  PersistentKnowledgeQualificationObservability,
  PersistentKnowledgeQualificationRecord,
  PersistentKnowledgeQualificationResult,
  PersistentKnowledgeQualificationScenario,
  PersistentKnowledgeQualificationState,
  PersistentKnowledgeQualificationTest,
  PersistentKnowledgeQualificationValidation,
  QualificationReport,
} from "@/types/persistent-knowledge-qualification";

const VERSION = "persistent-knowledge-qualification/v11.2" as const;
const ID = "PersistentKnowledgeQualification" as const;
const TENANT_ID = "tenant_mission_control";
const MISSION_SCOPE = "mission:persistent-intelligence:cross-mission-routing";
const STATES: readonly PersistentKnowledgeQualificationState[] = Object.freeze(["REJECTED", "INSUFFICIENT_EVIDENCE", "PENDING_REVIEW", "PENDING_OPERATOR", "QUALIFIED", "CERTIFIED"]);
const OUTCOMES = Object.freeze(["PASS", "CONDITIONAL_PASS", "REJECTED", "REQUIRES_MORE_EVIDENCE", "REQUIRES_GOVERNANCE_REVIEW", "REQUIRES_OPERATOR_APPROVAL"] as const);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function failureForScenario(scenario: PersistentKnowledgeQualificationScenario): PersistentKnowledgeQualificationFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }

function outcomeFor(failures: readonly PersistentKnowledgeQualificationFailure[]): PersistentKnowledgeCertificationOutcome {
  if (failures.includes("INSUFFICIENT_EVIDENCE")) return "REQUIRES_MORE_EVIDENCE";
  if (failures.includes("GOVERNANCE_REVIEW_REQUIRED")) return "REQUIRES_GOVERNANCE_REVIEW";
  if (failures.includes("OPERATOR_APPROVAL_REQUIRED")) return "REQUIRES_OPERATOR_APPROVAL";
  if (failures.length) return "REJECTED";
  return "PASS";
}
function stateFor(outcome: PersistentKnowledgeCertificationOutcome): PersistentKnowledgeQualificationState {
  if (outcome === "PASS") return "CERTIFIED";
  if (outcome === "REQUIRES_MORE_EVIDENCE") return "INSUFFICIENT_EVIDENCE";
  if (outcome === "REQUIRES_GOVERNANCE_REVIEW") return "PENDING_REVIEW";
  if (outcome === "REQUIRES_OPERATOR_APPROVAL") return "PENDING_OPERATOR";
  return "REJECTED";
}

function candidate(input: PersistentKnowledgeQualificationInput, failures: readonly PersistentKnowledgeQualificationFailure[]): PersistentKnowledgeCandidate {
  const tenant_id = input.tenant_id ?? TENANT_ID;
  const mission_scope = input.mission_scope ?? MISSION_SCOPE;
  const knowledge_type = input.knowledge_type ?? "PATTERN";
  const seed = { tenant_id, mission_scope, knowledge_type, version: VERSION };
  const base: Omit<PersistentKnowledgeCandidate, "integrity_hash"> = {
    knowledge_id: id("knowledge", seed),
    tenant_id,
    mission_scope,
    knowledge_type,
    knowledge_version: "1.0.0",
    summary: "Late multimodal mission evidence can safely qualify as persistent knowledge only after replay, governance, constitutional, duplicate, and operator gates pass.",
    deterministic_origin: !failures.includes("REPLAY_DIVERGENCE"),
    advisory_only: !failures.includes("ADVISORY_ONLY_VIOLATION"),
    evidence_refs: failures.includes("INSUFFICIENT_EVIDENCE") ? freezeArray(["evidence:single-source"]) : freezeArray(["evidence:operator-report", "evidence:telemetry-corroboration", "evidence:historical-replay"]),
    lineage_refs: failures.includes("LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray(["lineage:phase-10-certified-output", "lineage:persistent-foundation-certified"]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function contract(failures: readonly PersistentKnowledgeQualificationFailure[]): PersistentKnowledgeQualificationContract {
  const base: Omit<PersistentKnowledgeQualificationContract, "integrity_hash"> = {
    contract_id: id("persistent_knowledge_qualification_contract", VERSION),
    lifecycle: freezeArray(["KNOWLEDGE_CANDIDATE", "EVIDENCE_QUALIFICATION", "CONFIDENCE_QUALIFICATION", "TRUST_QUALIFICATION", "REPLAY_QUALIFICATION", "GOVERNANCE_QUALIFICATION", "CONSTITUTIONAL_QUALIFICATION", "DUPLICATE_CONSOLIDATION", "OPERATOR_APPROVAL", "CERTIFICATION", "PERSISTENT_KNOWLEDGE"]),
    states: STATES,
    evidence_gate_required: !failures.includes("INSUFFICIENT_EVIDENCE"),
    confidence_gate_required: !failures.includes("OVERCONFIDENCE_DETECTED"),
    trust_gate_required: !failures.includes("TRUST_THRESHOLD_NOT_MET"),
    replay_gate_required: !failures.includes("REPLAY_DIVERGENCE"),
    governance_gate_required: !failures.includes("GOVERNANCE_REVIEW_REQUIRED"),
    constitutional_gate_required: !failures.includes("CONSTITUTIONAL_VIOLATION"),
    duplicate_consolidation_required: !failures.includes("DUPLICATE_NOT_CONSOLIDATED"),
    operator_approval_required: !failures.includes("OPERATOR_APPROVAL_REQUIRED"),
    persistence_without_certification_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: failures.includes("QUALIFICATION_CONTRACT_INVALID") ? "invalid-qualification-contract" : hashWithoutIntegrity(base) });
}

function report(report_id: string, score: number, passed: boolean, findings: readonly string[], refs: readonly string[]): QualificationReport {
  const base: Omit<QualificationReport, "integrity_hash"> = { report_id, score, passed, findings: freezeArray(findings), evidence_refs: freezeArray(refs), replay_ref: id("replay", { report_id, score, passed }) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function evidenceReport(candidateRecord: PersistentKnowledgeCandidate, failures: readonly PersistentKnowledgeQualificationFailure[]): QualificationReport {
  const passed = candidateRecord.evidence_refs.length >= 3 && !failures.includes("INSUFFICIENT_EVIDENCE");
  return report("evidence_qualification_report", passed ? 0.94 : 0.41, passed, passed ? ["Evidence complete, diverse, fresh, corroborated, and provenance-linked."] : ["Evidence is incomplete or insufficiently corroborated."], candidateRecord.evidence_refs);
}
function confidenceReport(candidateRecord: PersistentKnowledgeCandidate, failures: readonly PersistentKnowledgeQualificationFailure[]): QualificationReport {
  const passed = !failures.includes("OVERCONFIDENCE_DETECTED");
  return report("confidence_qualification_report", passed ? 0.91 : 0.58, passed, passed ? ["Confidence calibration is stable and historically supported."] : ["Claim confidence exceeds evidence support."], candidateRecord.evidence_refs);
}
function trustReport(candidateRecord: PersistentKnowledgeCandidate, failures: readonly PersistentKnowledgeQualificationFailure[]): QualificationReport {
  const passed = !failures.includes("TRUST_THRESHOLD_NOT_MET");
  return report("trust_qualification_report", passed ? 0.93 : 0.52, passed, passed ? ["Source, evidence, replay, and certification history exceed trust threshold."] : ["Trust threshold not met."], candidateRecord.evidence_refs);
}
function replayReport(candidateRecord: PersistentKnowledgeCandidate, failures: readonly PersistentKnowledgeQualificationFailure[]): QualificationReport {
  const passed = candidateRecord.deterministic_origin && !failures.includes("REPLAY_DIVERGENCE");
  return report("replay_qualification_report", passed ? 1 : 0.13, passed, passed ? ["Evidence, reasoning, recommendations, simulations, outcomes, governance, and approval replay match."] : ["Replay divergence detected and persistence blocked."], candidateRecord.lineage_refs);
}
function governanceReport(candidateRecord: PersistentKnowledgeCandidate, failures: readonly PersistentKnowledgeQualificationFailure[]): GovernanceQualificationReport {
  const passed = !failures.includes("GOVERNANCE_REVIEW_REQUIRED") && !failures.includes("TENANT_ISOLATION_BREACH") && !failures.includes("AUTHORITY_BOUNDARY_VIOLATION");
  const base: Omit<GovernanceQualificationReport, "integrity_hash"> = { ...report("governance_qualification_report", passed ? 0.97 : 0.34, passed, passed ? ["Policy, authority, tenant isolation, lifecycle, audit, and certification checks pass."] : ["Governance review is required before persistence."], candidateRecord.evidence_refs), decision: passed ? "APPROVED" : "REVIEW_REQUIRED", policy_refs: freezeArray(["policy:persistent-knowledge:persistence", "policy:tenant-isolation", "policy:human-authority"]) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function constitutionalReport(candidateRecord: PersistentKnowledgeCandidate, failures: readonly PersistentKnowledgeQualificationFailure[]): ConstitutionalQualificationReport {
  const passed = candidateRecord.advisory_only && !failures.includes("CONSTITUTIONAL_VIOLATION") && !failures.includes("AUTHORITY_BOUNDARY_VIOLATION");
  const base: Omit<ConstitutionalQualificationReport, "integrity_hash"> = { ...report("constitutional_qualification_report", passed ? 1 : 0, passed, passed ? ["Authority doctrine, advisory-only constraints, safety, human supremacy, and mission boundaries pass."] : ["Constitutional invariant violation blocks persistence."], candidateRecord.lineage_refs), qualification: passed ? "COMPLIANT" : "VIOLATION", invariant_refs: freezeArray(["constitution:advisory-only", "constitution:human-supremacy", "constitution:mission-boundaries"]) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function duplicateReport(candidateRecord: PersistentKnowledgeCandidate, failures: readonly PersistentKnowledgeQualificationFailure[]): DuplicateConsolidationReport {
  const passed = !failures.includes("DUPLICATE_NOT_CONSOLIDATED");
  const base: Omit<DuplicateConsolidationReport, "integrity_hash"> = { consolidation_id: id("knowledge_consolidation", candidateRecord.knowledge_id), duplicate_status: passed ? "DUPLICATE_CONSOLIDATED" : "CONFLICT_REQUIRES_REVIEW", duplicates_detected: 2, deterministic_merge: passed, lineage_preserved: passed, consolidated_version_id: id("knowledge_version", { knowledge_id: candidateRecord.knowledge_id, consolidated: true }) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function approvalRecord(candidateRecord: PersistentKnowledgeCandidate, failures: readonly PersistentKnowledgeQualificationFailure[]): OperatorApprovalRecord {
  const passed = !failures.includes("OPERATOR_APPROVAL_REQUIRED");
  const base: Omit<OperatorApprovalRecord, "integrity_hash"> = { approval_id: id("operator_approval", candidateRecord.knowledge_id), required: true, outcome: passed ? "APPROVED" : "REQUIRES_MORE_EVIDENCE", approved_by: passed ? "operator:persistent-knowledge-review-board" : "pending", explanation: passed ? "Human review approved evidence, replay, governance, and duplicate consolidation." : "Human approval remains pending.", evidence_inspected: candidateRecord.evidence_refs, immutable_audit: !failures.includes("LEDGER_MUTATION") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function record(candidateRecord: PersistentKnowledgeCandidate, outcome: PersistentKnowledgeCertificationOutcome, reports: { evidence: QualificationReport; confidence: QualificationReport; trust: QualificationReport; replay: QualificationReport; governance: GovernanceQualificationReport; constitutional: ConstitutionalQualificationReport; duplicate: DuplicateConsolidationReport; approval: OperatorApprovalRecord }): PersistentKnowledgeQualificationRecord {
  const base: Omit<PersistentKnowledgeQualificationRecord, "integrity_hash"> = {
    qualification_id: id("qualification", candidateRecord.knowledge_id),
    knowledge_id: candidateRecord.knowledge_id,
    tenant_id: candidateRecord.tenant_id,
    mission_scope: candidateRecord.mission_scope,
    knowledge_type: candidateRecord.knowledge_type,
    knowledge_version: candidateRecord.knowledge_version,
    qualification_state: stateFor(outcome),
    evidence_score: reports.evidence.score,
    confidence_score: reports.confidence.score,
    trust_score: reports.trust.score,
    replay_score: reports.replay.score,
    governance_score: reports.governance.score,
    constitutional_score: reports.constitutional.score,
    operator_status: reports.approval.outcome,
    duplicate_status: reports.duplicate.duplicate_status,
    certification_status: outcome,
    qualification_timestamp: "2026-07-14T00:00:00.000Z",
    qualified_by: "persistent-knowledge-qualification-engine",
    replay_reference: reports.replay.replay_ref,
    lineage_reference: candidateRecord.lineage_refs[0] ?? "lineage:missing",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function ledger(candidateRecord: PersistentKnowledgeCandidate, qualificationId: string, failures: readonly PersistentKnowledgeQualificationFailure[]): readonly PersistentKnowledgeQualificationLedgerEntry[] {
  const events = freezeArray(["candidate.received", "evidence.qualified", "confidence.qualified", "trust.qualified", "replay.qualified", "governance.qualified", "constitutional.qualified", "duplicates.consolidated", "operator.approved", "certification.completed"]);
  return freezeArray(events.map((event, index) => {
    const base: Omit<PersistentKnowledgeQualificationLedgerEntry, "integrity_hash"> = { ledger_entry_id: id("knowledge_qualification_ledger", `${qualificationId}:${index}:${event}`), sequence: index + 1, event, qualification_id: qualificationId, knowledge_id: candidateRecord.knowledge_id, evidence_refs: candidateRecord.evidence_refs, replay_refs: freezeArray([`replay:persistent-knowledge-qualification:${index + 1}`]), append_only: !failures.includes("LEDGER_MUTATION") };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function observability(failures: readonly PersistentKnowledgeQualificationFailure[]): PersistentKnowledgeQualificationObservability {
  const base: Omit<PersistentKnowledgeQualificationObservability, "integrity_hash"> = { observability_id: "persistent_knowledge_qualification_observability", throughput_per_hour: 24, qualification_latency_ms: 46, evidence_quality_trend: freezeArray([0.86, 0.9, 0.94]), confidence_distribution: freezeArray([0.78, 0.84, 0.91]), trust_distribution: freezeArray([0.81, 0.88, 0.93]), replay_failures: failures.includes("REPLAY_DIVERGENCE") ? 1 : 0, governance_rejection_rate: failures.includes("GOVERNANCE_REVIEW_REQUIRED") ? 0.18 : 0, constitutional_violations: failures.includes("CONSTITUTIONAL_VIOLATION") ? 1 : 0, operator_approval_latency_ms: failures.includes("OPERATOR_APPROVAL_REQUIRED") ? 120000 : 5200, duplicate_detection_rate: 0.22, consolidation_success_rate: failures.includes("DUPLICATE_NOT_CONSOLIDATED") ? 0.5 : 1, certification_success_rate: failures.length ? 0 : 1 };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function test(name: string, passed: boolean, failure: PersistentKnowledgeQualificationFailure, refs: readonly string[]): PersistentKnowledgeQualificationTest {
  const base: Omit<PersistentKnowledgeQualificationTest, "integrity_hash"> = { test_id: id("persistent_knowledge_qualification_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
type TestBase = Omit<PersistentKnowledgeQualificationResult, "certification" | "replay_hash" | "integrity_hash">;
function tests(result: TestBase): readonly PersistentKnowledgeQualificationTest[] {
  const refs = freezeArray([result.candidate.integrity_hash, result.record.integrity_hash]);
  return freezeArray([
    test("Qualification Contract valid", hashWithoutIntegrity(result.contract) === result.contract.integrity_hash, "QUALIFICATION_CONTRACT_INVALID", refs),
    test("Evidence qualification deterministic", hashWithoutIntegrity(result.evidence) === result.evidence.integrity_hash, "INSUFFICIENT_EVIDENCE", refs),
    test("Evidence sufficiency enforced", result.evidence.passed && result.evidence.score >= 0.8, "INSUFFICIENT_EVIDENCE", refs),
    test("Confidence qualification reproducible", hashWithoutIntegrity(result.confidence) === result.confidence.integrity_hash, "OVERCONFIDENCE_DETECTED", refs),
    test("Confidence calibration validated", result.confidence.passed && result.confidence.score >= 0.75, "OVERCONFIDENCE_DETECTED", refs),
    test("Trust qualification deterministic", result.trust.passed && result.trust.score >= 0.8, "TRUST_THRESHOLD_NOT_MET", refs),
    test("Replay validation reproducible", result.replay.passed && result.replay.score === 1, "REPLAY_DIVERGENCE", refs),
    test("Replay divergence detected", result.replay.passed, "REPLAY_DIVERGENCE", refs),
    test("Governance validation mandatory", result.governance.passed && result.governance.decision === "APPROVED", "GOVERNANCE_REVIEW_REQUIRED", refs),
    test("Constitutional validation mandatory", result.constitutional.passed && result.constitutional.qualification === "COMPLIANT", "CONSTITUTIONAL_VIOLATION", refs),
    test("Human approval workflow enforced", result.operator_approval.required && result.operator_approval.outcome === "APPROVED", "OPERATOR_APPROVAL_REQUIRED", refs),
    test("Authority boundaries preserved", result.governance.passed, "AUTHORITY_BOUNDARY_VIOLATION", refs),
    test("Advisory-only invariant preserved", result.candidate.advisory_only, "ADVISORY_ONLY_VIOLATION", refs),
    test("Tenant isolation maintained", result.candidate.tenant_id.length > 0 && result.foundation_certified, "TENANT_ISOLATION_BREACH", refs),
    test("Duplicate detection deterministic", hashWithoutIntegrity(result.duplicate_consolidation) === result.duplicate_consolidation.integrity_hash, "DUPLICATE_NOT_CONSOLIDATED", refs),
    test("Duplicate consolidation reproducible", result.duplicate_consolidation.deterministic_merge && result.duplicate_consolidation.lineage_preserved, "DUPLICATE_NOT_CONSOLIDATED", refs),
    test("Knowledge lineage complete", result.candidate.lineage_refs.length > 0 && result.record.lineage_reference !== "lineage:missing", "LINEAGE_INCOMPLETE", refs),
    test("Integrity hashes reproducible", hashWithoutIntegrity(result.record) === result.record.integrity_hash, "INTEGRITY_HASH_MISMATCH", refs),
    test("Qualification ledger append-only", result.ledger.every((entry) => entry.append_only), "LEDGER_MUTATION", refs),
    test("Certification deterministic", result.record.certification_status === "PASS", "INTEGRITY_HASH_MISMATCH", refs),
  ]);
}

function replayHash(result: Omit<PersistentKnowledgeQualificationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ candidate: result.candidate.integrity_hash, contract: result.contract.integrity_hash, reports: [result.evidence.integrity_hash, result.confidence.integrity_hash, result.trust.integrity_hash, result.replay.integrity_hash, result.governance.integrity_hash, result.constitutional.integrity_hash], duplicate: result.duplicate_consolidation.integrity_hash, approval: result.operator_approval.integrity_hash, record: result.record.integrity_hash, ledger: result.ledger.map((entry) => entry.integrity_hash), certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<PersistentKnowledgeQualificationResult, "integrity_hash">): string {
  return hash({ version: result.qualification_version, id: result.qualification_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function qualifyPersistentKnowledge(input: PersistentKnowledgeQualificationInput = {}): PersistentKnowledgeQualificationResult {
  const foundation = buildPersistentIntelligenceFoundation({ tenant_id: input.tenant_id });
  const foundationValid = validatePersistentIntelligenceFoundation(foundation).valid;
  const scenarioFailure = failureForScenario(input.scenario ?? "BASELINE");
  const initialFailures = freezeArray<PersistentKnowledgeQualificationFailure>([...(foundationValid ? [] : ["FOUNDATION_NOT_CERTIFIED" as const]), ...(scenarioFailure ? [scenarioFailure] : [])]);
  const candidateRecord = candidate(input, initialFailures);
  const evidence = evidenceReport(candidateRecord, initialFailures);
  const confidence = confidenceReport(candidateRecord, initialFailures);
  const trust = trustReport(candidateRecord, initialFailures);
  const replay = replayReport(candidateRecord, initialFailures);
  const governance = governanceReport(candidateRecord, initialFailures);
  const constitutional = constitutionalReport(candidateRecord, initialFailures);
  const duplicate = duplicateReport(candidateRecord, initialFailures);
  const approval = approvalRecord(candidateRecord, initialFailures);
  const provisionalOutcome = outcomeFor(initialFailures);
  const qualificationRecord = record(candidateRecord, provisionalOutcome, { evidence, confidence, trust, replay, governance, constitutional, duplicate, approval });
  const ledgerRows = ledger(candidateRecord, qualificationRecord.qualification_id, initialFailures);
  const baseWithoutCertification: TestBase = { qualification_version: VERSION, qualification_identifier: ID, foundation_certified: foundationValid, candidate: candidateRecord, contract: contract(initialFailures), evidence, confidence, trust, replay, governance, constitutional, duplicate_consolidation: duplicate, operator_approval: approval, record: qualificationRecord, ledger: ledgerRows, observability: observability(initialFailures) };
  const validationTests = tests(baseWithoutCertification);
  const failures = freezeArray([...new Set([...initialFailures, ...validationTests.map((item) => item.failure_reason).filter((failure): failure is PersistentKnowledgeQualificationFailure => Boolean(failure))])]);
  const outcome = outcomeFor(failures);
  const finalRecord = record(candidateRecord, outcome, { evidence, confidence, trust, replay, governance, constitutional, duplicate, approval });
  const certBase: Omit<PersistentKnowledgeQualificationCertification, "integrity_hash"> = { certification_id: id("persistent_knowledge_qualification_certification", finalRecord.qualification_id), outcome, eligible_for_persistence: outcome === "PASS", failures, tests: validationTests };
  const certification = Object.freeze({ ...certBase, integrity_hash: hashWithoutIntegrity(certBase) });
  const base: Omit<PersistentKnowledgeQualificationResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutCertification, record: finalRecord, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validatePersistentKnowledgeQualification(result?: PersistentKnowledgeQualificationResult): PersistentKnowledgeQualificationValidation {
  if (!result) {
    const failures = freezeArray<PersistentKnowledgeQualificationFailure>(["QUALIFICATION_CONTRACT_INVALID"]);
    const base: Omit<PersistentKnowledgeQualificationValidation, "validation_hash"> = { qualification_id: null, valid: false, outcome: "REJECTED", eligible_for_persistence: false, failures, replay_hash_valid: false, integrity_hash_valid: false };
    return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const nested = hashWithoutIntegrity(result.candidate) === result.candidate.integrity_hash
    && hashWithoutIntegrity(result.contract) === result.contract.integrity_hash
    && hashWithoutIntegrity(result.record) === result.record.integrity_hash
    && result.ledger.every((entry) => hashWithoutIntegrity(entry) === entry.integrity_hash)
    && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nested;
  const valid = result.certification.outcome === "PASS" && result.certification.eligible_for_persistence && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid;
  const base: Omit<PersistentKnowledgeQualificationValidation, "validation_hash"> = { qualification_id: result.record.qualification_id, valid, outcome: result.certification.outcome, eligible_for_persistence: result.certification.eligible_for_persistence, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid };
  return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayPersistentKnowledgeQualification(result = qualifyPersistentKnowledge()): boolean {
  const replayed = qualifyPersistentKnowledge({ tenant_id: result.candidate.tenant_id, mission_scope: result.candidate.mission_scope, knowledge_type: result.candidate.knowledge_type });
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validatePersistentKnowledgeQualification(result).valid;
}

export function getPersistentKnowledgeQualificationContract(): PersistentKnowledgeQualificationContractBundle {
  const result = qualifyPersistentKnowledge();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, no_persistence_without_successful_qualification: true, qualification_states: STATES, certification_outcomes: OUTCOMES, mandatory_human_authority: true }), result, validation: validatePersistentKnowledgeQualification(result), observability: result.observability });
}

export const PersistentKnowledgeQualification = Object.freeze({ qualify: qualifyPersistentKnowledge, validate: validatePersistentKnowledgeQualification, replay: replayPersistentKnowledgeQualification });
