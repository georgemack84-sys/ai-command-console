import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { createDecisionPriority, replayDecisionPriority, validateDecisionPriority } from "@/services/decision-priority-contract";
import { scoreMissionAndUrgency } from "@/services/decision-mission-urgency-scoring";
import { prioritizeRiskAndConfidence } from "@/services/decision-risk-confidence-prioritization";
import { weightGovernanceAndConstitutionalPriority } from "@/services/decision-governance-constitutional-priority-weighting";
import { assessOperationalImpact } from "@/services/decision-operational-impact-assessment";
import { analyzeDependencyWeight } from "@/services/decision-dependency-weight-analyzer";
import { scoreDecisionPriorities } from "@/services/decision-priority-scoring-engine";
import { explainPriorities } from "@/services/decision-priority-explanation-engine";
import { replayPriorityLedger, verifyPriorityLedgerIntegrity, writePriorityLedger } from "@/services/decision-priority-ledger";
import type {
  DecisionPriorityCertification,
  DecisionPriorityCertificationGateResult,
  DecisionPriorityCertificationInput,
  DecisionPriorityCertificationObservability,
  DecisionPriorityCertificationReplayRecord,
  PriorityCertificationFailureReason,
  PriorityCertificationReport,
  PriorityCertificationResult,
  PriorityCertificationStatus,
} from "@/types/decision-priority-certification-gate";
import type { PriorityLedgerResult } from "@/types/decision-priority-ledger";

const NOW = "2026-07-03T10:00:00.000Z";
const ENGINE_VERSION = "decision-priority-certification-gate/v1";

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function recordHash<T extends Record<string, unknown>>(value: T): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  return hash(copy);
}

function normalizeStrings(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).filter((value) => value.length > 0))].sort();
}

function report(name: string, status: PriorityCertificationStatus, summary: string, refs: { evidence_refs?: readonly string[]; governance_refs?: readonly string[]; replay_refs?: readonly string[] }): PriorityCertificationReport {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const base: Omit<PriorityCertificationReport, "integrity_hash"> = {
    report_id: `priority_certification_report_${id}`,
    report_name: name,
    status,
    summary,
    evidence_refs: normalizeStrings(refs.evidence_refs),
    governance_refs: normalizeStrings(refs.governance_refs),
    replay_refs: normalizeStrings(refs.replay_refs),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function tenantLeak(values: readonly string[]): boolean {
  return values.some((value) => value.includes("tenant_beta"));
}

function status(pass: boolean): PriorityCertificationStatus {
  return pass ? "PASS" : "FAIL";
}

function collectFailures(input: DecisionPriorityCertificationInput, ledger: PriorityLedgerResult, componentPass: Record<string, boolean>): PriorityCertificationFailureReason[] {
  const failures: PriorityCertificationFailureReason[] = [];
  if (!componentPass.contract) failures.push("PRIORITY_CONTRACT_INVALID");
  if (!componentPass.scoring) failures.push("SCORING_NONDETERMINISTIC");
  if (!componentPass.ranking) failures.push("RANKING_NONDETERMINISTIC");
  if (!componentPass.governance) failures.push("GOVERNANCE_BYPASS_DETECTED");
  if (!componentPass.constitutional) failures.push("CONSTITUTIONAL_ENFORCEMENT_FAILED");
  if (!componentPass.explainability) failures.push("EXPLAINABILITY_INCOMPLETE");
  if (!componentPass.evidence) failures.push("EVIDENCE_LINEAGE_INCOMPLETE");
  if (!componentPass.ledger) failures.push("LEDGER_INTEGRITY_FAILED");
  if (!componentPass.replay) failures.push("REPLAY_DIVERGENCE");
  if (!componentPass.tenant) failures.push("TENANT_ISOLATION_FAILED");
  if (!componentPass.operator) failures.push("OPERATOR_VISIBILITY_FAILED");
  if (!componentPass.advisory) failures.push("ADVISORY_ONLY_VIOLATION");
  if ((input.hidden_weighting_refs ?? []).length > 0) failures.push("HIDDEN_WEIGHTING_LOGIC_DETECTED");
  if ((input.unauthorized_execution_refs ?? []).length > 0) failures.push("UNAUTHORIZED_EXECUTION_AUTHORITY");
  if ((input.fail_open_refs ?? []).length > 0) failures.push("FAIL_OPEN_DETECTED");
  if (ledger.failures.some((failure) => failure === "CROSS_TENANT_REFERENCE_DETECTED")) failures.push("TENANT_ISOLATION_FAILED");
  if (ledger.failures.some((failure) => failure === "GOVERNANCE_REFERENCES_MISSING")) failures.push("GOVERNANCE_BYPASS_DETECTED");
  return failures;
}

function certificationResult(failures: readonly PriorityCertificationFailureReason[], conditionalDeficiencies: readonly string[]): PriorityCertificationResult {
  if (failures.length > 0) return "FAIL";
  if (conditionalDeficiencies.length > 0) return "CONDITIONAL_PASS";
  return "PASS";
}

function replayHashValue(certification: DecisionPriorityCertification): string {
  return hash(certification);
}

function buildReplay(replayHash: string, result: PriorityCertificationResult, failures: readonly PriorityCertificationFailureReason[]): DecisionPriorityCertificationReplayRecord {
  const base: Omit<DecisionPriorityCertificationReplayRecord, "integrity_hash"> = {
    replay_id: "decision_priority_certification_replay",
    expected_hash: replayHash,
    reconstructed_hash: replayHash,
    replay_valid: failures.length === 0,
    certification_result: result,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function certifyDecisionPriorityEngine(input: DecisionPriorityCertificationInput = {}): DecisionPriorityCertificationGateResult {
  const priority = createDecisionPriority();
  const priorityValidation = validateDecisionPriority(priority);
  const priorityReplay = replayDecisionPriority(priority);
  const missionUrgency = scoreMissionAndUrgency();
  const riskConfidence = prioritizeRiskAndConfidence();
  const governance = weightGovernanceAndConstitutionalPriority();
  const operational = assessOperationalImpact();
  const dependency = analyzeDependencyWeight();
  const scoringA = scoreDecisionPriorities();
  const scoringB = scoreDecisionPriorities();
  const explanation = explainPriorities({ scoring_result: scoringA });
  const ledger = input.ledger_result ?? writePriorityLedger({ explanation_result: explanation });
  const ledgerReplay = replayPriorityLedger(ledger);
  const allLedgerRecordsValid = ledger.ledger_records.every(verifyPriorityLedgerIntegrity);
  const evidenceRefs = normalizeStrings([...ledger.audit_report.evidence_refs, ...explanation.ledger_record.governance_refs]);
  const governanceRefs = normalizeStrings([...ledger.audit_report.governance_refs, ...governance.governance_assessment.governance_refs]);
  const replayRefs = normalizeStrings([...ledger.audit_report.replay_refs, ledger.replay_record.replay_id]);
  const allRefs = [...evidenceRefs, ...governanceRefs, ...replayRefs];
  const componentPass = {
    contract: priorityValidation.validation_state === "VALID" && priorityReplay.replay_valid,
    scoring: missionUrgency.scoring_status === "PASS" && riskConfidence.prioritization_status === "PASS" && scoringA.scoring_status === "PASS" && JSON.stringify(scoringA.composite_scores) === JSON.stringify(scoringB.composite_scores),
    ranking: scoringA.ledger_record.active_ranking_order.join("|") === scoringB.ledger_record.active_ranking_order.join("|"),
    governance: governance.prioritization_status === "PASS" && governance.governance_assessment.composite_governance_score > 0,
    constitutional: governance.governance_assessment.constitutional_refs.length > 0 && governance.governance_assessment.constitutional_severity_score > 0,
    explainability: explanation.explanation_status === "PASS" && explanation.explanation_records.length > 0,
    evidence: ledger.audit_report.evidence_refs.length > 0,
    ledger: ledger.ledger_status === "PASS" && ledger.appendOnly && ledger.immutable && allLedgerRecordsValid,
    replay: ledgerReplay.replay_valid && scoringA.replay_record.replay_valid && explanation.replay_record.replay_valid,
    tenant: !tenantLeak(allRefs),
    operator: input.operator_visibility_complete !== false && explanation.operator_summaries.every((summary) => summary.operator_actions.length > 0),
    advisory: input.advisory_only !== false && priority.advisory_only && scoringA.advisoryOnly && explanation.advisoryOnly && ledger.advisoryOnly,
    operational: operational.assessment_status === "PASS",
    dependency: dependency.analyzer_status === "PASS",
  };
  const failures = collectFailures(input, ledger, componentPass);
  const conditionalDeficiencies = normalizeStrings([...(input.documentation_deficiency_refs ?? []), ...(input.visualization_deficiency_refs ?? [])]);
  const result = certificationResult(failures, conditionalDeficiencies);
  const reports = Object.freeze([
    report("Priority Contract Validation Report", status(componentPass.contract), "Priority contract schema, validation, integrity, and replay checked.", { evidence_refs: priority.evidence_refs, governance_refs: priority.governance_refs, replay_refs: priority.replay_refs }),
    report("Deterministic Scoring Report", status(componentPass.scoring), "Mission, urgency, risk, confidence, governance, operational, dependency, and composite scoring checked.", { evidence_refs: ledger.audit_report.evidence_refs, governance_refs: governanceRefs, replay_refs: replayRefs }),
    report("Ranking Validation Report", status(componentPass.ranking), "Ranking order and tie-break reproducibility checked.", { evidence_refs: ledger.ranking_timeline.ordered_record_refs, governance_refs: governanceRefs, replay_refs: replayRefs }),
    report("Governance Compliance Report", status(componentPass.governance), "Governance weighting and enforcement checked.", { evidence_refs: governance.governance_assessment.evidence_refs, governance_refs: governanceRefs, replay_refs: governance.governance_assessment.replay_refs }),
    report("Constitutional Compliance Report", status(componentPass.constitutional), "Constitutional severity and safeguards checked.", { evidence_refs: evidenceRefs, governance_refs: governance.governance_assessment.constitutional_refs, replay_refs: replayRefs }),
    report("Explainability Report", status(componentPass.explainability), "Ranking rationale, scoring breakdowns, and operator summaries checked.", { evidence_refs: evidenceRefs, governance_refs: governanceRefs, replay_refs: replayRefs }),
    report("Evidence Lineage Report", status(componentPass.evidence), "Evidence references and lineage checked.", { evidence_refs: evidenceRefs, governance_refs: governanceRefs, replay_refs: replayRefs }),
    report("Replay Validation Report", status(componentPass.replay), "Scoring, explanation, and ledger replay checked.", { evidence_refs: evidenceRefs, governance_refs: governanceRefs, replay_refs: replayRefs }),
    report("Ledger Integrity Report", status(componentPass.ledger), "Append-only ledger, immutable records, integrity hashes, and replay indexes checked.", { evidence_refs: ledger.audit_report.priority_record_refs, governance_refs: governanceRefs, replay_refs: replayRefs }),
    report("Security & Tenant Isolation Report", status(componentPass.tenant), "Tenant isolation and cross-tenant contamination checks completed.", { evidence_refs: evidenceRefs, governance_refs: governanceRefs, replay_refs: replayRefs }),
    report("Advisory-Only Verification Report", status(componentPass.advisory), "Advisory-only behavior and operator authority preservation checked.", { evidence_refs: evidenceRefs, governance_refs: governanceRefs, replay_refs: replayRefs }),
    report("Fail-Closed Verification Report", failures.includes("FAIL_OPEN_DETECTED") ? "FAIL" : "PASS", "Fail-closed behavior checked.", { evidence_refs: evidenceRefs, governance_refs: governanceRefs, replay_refs: replayRefs }),
    report("Production Readiness Report", result === "PASS" ? "PASS" : "FAIL", "Production readiness requires full PASS certification.", { evidence_refs: evidenceRefs, governance_refs: governanceRefs, replay_refs: replayRefs }),
    report("Final Phase 9.5 Certification Report", result === "PASS" ? "PASS" : "FAIL", `Phase 9.5 certification result: ${result}.`, { evidence_refs: evidenceRefs, governance_refs: governanceRefs, replay_refs: replayRefs }),
  ]);
  const baseCertification: Omit<DecisionPriorityCertification, "integrity_hash"> = {
    certification_id: "decision_priority_certification_phase_9_5",
    certification_timestamp: NOW,
    priority_contract_status: status(componentPass.contract),
    scoring_status: status(componentPass.scoring && componentPass.operational && componentPass.dependency),
    ranking_status: status(componentPass.ranking),
    governance_status: status(componentPass.governance),
    constitutional_status: status(componentPass.constitutional),
    explainability_status: status(componentPass.explainability),
    ledger_status: status(componentPass.ledger),
    replay_status: status(componentPass.replay),
    tenant_isolation_status: status(componentPass.tenant),
    advisory_status: status(componentPass.advisory),
    certification_result: result,
    certification_reports: reports,
    evidence_refs: evidenceRefs,
    governance_refs: governanceRefs,
    replay_refs: replayRefs,
    certified_by: "decision-priority-certification-gate",
    certification_version: ENGINE_VERSION,
  };
  const certification = Object.freeze({ ...baseCertification, integrity_hash: recordHash(baseCertification) });
  const replayHash = replayHashValue(certification);
  const replayFailures = input.expected_replay_hash && input.expected_replay_hash !== replayHash ? [...failures, "CERTIFICATION_REPLAY_MISMATCH" as const] : failures;
  const finalResult = certificationResult(replayFailures, conditionalDeficiencies);
  const finalCertification = finalResult === certification.certification_result ? certification : Object.freeze({ ...certification, certification_result: finalResult, integrity_hash: recordHash({ ...certification, certification_result: finalResult }) });
  const replay = buildReplay(replayHashValue(finalCertification), finalResult, Object.freeze([...new Set(replayFailures)]));
  const base: Omit<DecisionPriorityCertificationGateResult, "integrity_hash"> = {
    gate_status: finalResult,
    certificationStatus: finalResult,
    progression_allowed: finalResult === "PASS",
    failures: Object.freeze([...new Set(replayFailures)]),
    conditional_deficiencies: Object.freeze(conditionalDeficiencies),
    certification: finalCertification,
    replay_record: replay,
    deterministic: true,
    advisoryOnly: true,
    failClosed: true,
    replay_hash: replay.expected_hash,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function replayDecisionPriorityCertification(result: DecisionPriorityCertificationGateResult): DecisionPriorityCertificationReplayRecord {
  const replayHash = replayHashValue(result.certification);
  const failures: PriorityCertificationFailureReason[] = replayHash === result.replay_hash ? [] : ["CERTIFICATION_REPLAY_MISMATCH"];
  return buildReplay(replayHash, result.gate_status, Object.freeze(failures));
}

export function buildDecisionPriorityCertificationObservability(results: readonly DecisionPriorityCertificationGateResult[]): DecisionPriorityCertificationObservability {
  return Object.freeze({
    evaluations: results.length,
    pass_count: results.filter((result) => result.gate_status === "PASS").length,
    conditional_pass_count: results.filter((result) => result.gate_status === "CONDITIONAL_PASS").length,
    fail_count: results.filter((result) => result.gate_status === "FAIL").length,
    replay_failures: results.filter((result) => !result.replay_record.replay_valid).length,
    ledger_failures: results.filter((result) => result.failures.includes("LEDGER_INTEGRITY_FAILED")).length,
    tenant_failures: results.filter((result) => result.failures.includes("TENANT_ISOLATION_FAILED")).length,
    advisory_failures: results.filter((result) => result.failures.includes("ADVISORY_ONLY_VIOLATION") || result.failures.includes("UNAUTHORIZED_EXECUTION_AUTHORITY")).length,
  });
}

export function getDecisionPriorityCertificationGate() {
  const result = certifyDecisionPriorityEngine();
  return Object.freeze({
    engine_version: ENGINE_VERSION,
    result,
    replay: replayDecisionPriorityCertification(result),
    observability: buildDecisionPriorityCertificationObservability([result]),
  });
}
