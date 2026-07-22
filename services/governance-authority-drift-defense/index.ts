import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishDriftDefenseArchitecture, replayDriftDefenseArchitecture } from "@/services/drift-defense-architecture";
import type { DriftResponse, DriftSeverity } from "@/types/drift-defense-architecture";
import type {
  ApprovalWorkflowIntegrityReport,
  AuthorityDriftReport,
  ConstitutionalComplianceReport,
  EscalationIntegrityReport,
  GovernanceAuthorityApiSurface,
  GovernanceAuthorityDriftFailure,
  GovernanceAuthorityDriftScenario,
  GovernanceAuthorityDriftStatus,
  GovernanceAuthorityFoundation,
  GovernanceAuthorityInput,
  GovernanceAuthorityMetrics,
  GovernanceAuthorityResult,
  GovernanceBaseline,
  GovernanceContainmentDecision,
  GovernanceDriftRecord,
  GovernanceDriftReport,
  MandatoryEscalation,
} from "@/types/governance-authority-drift-defense";

const DEFENSE_VERSION = "governance-authority-drift-defense/v1" as const;
const DEFENSE_IDENTIFIER = "GovernanceAuthorityDriftDefense" as const;
const DEFENSE_TIMESTAMP = "2026-07-11T00:00:00.000Z" as const;

type Scenario = NonNullable<GovernanceAuthorityInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function buildApiSurface(): GovernanceAuthorityApiSurface {
  const base: Omit<GovernanceAuthorityApiSurface, "integrity_hash"> = {
    api_id: "governance_authority_drift_defense_api",
    defend_governance_authority: "POST /governance-authority-drift-defense/defend",
    retrieve_baseline: "POST /governance-authority-drift-defense/baseline",
    retrieve_governance_report: "POST /governance-authority-drift-defense/governance-report",
    retrieve_authority_report: "POST /governance-authority-drift-defense/authority-report",
    retrieve_constitutional_report: "POST /governance-authority-drift-defense/constitutional-report",
    retrieve_approval_report: "POST /governance-authority-drift-defense/approval-report",
    retrieve_escalation_report: "POST /governance-authority-drift-defense/escalation-report",
    retrieve_containment: "POST /governance-authority-drift-defense/containment",
    retrieve_ledger_record: "POST /governance-authority-drift-defense/ledger",
    retrieve_metrics: "POST /governance-authority-drift-defense/metrics",
    replay_defense: "POST /governance-authority-drift-defense/replay",
    inspect_defense: "POST /governance-authority-drift-defense/inspect",
    retrieve_contract: "GET /governance-authority-drift-defense/contract",
    authority_expansion_supported: false,
    governance_bypass_supported: false,
    autonomous_execution_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): GovernanceAuthorityDriftFailure | undefined {
  const map: Partial<Record<GovernanceAuthorityDriftScenario, GovernanceAuthorityDriftFailure>> = {
    GOVERNANCE_RELAXATION: "GOVERNANCE_RELAXATION_DETECTED",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION_DETECTED",
    AUTHORITY_EXPANSION: "AUTHORITY_EXPANSION_DETECTED",
    APPROVAL_BYPASS: "APPROVAL_BYPASS_ATTEMPT",
    GOVERNANCE_RULE_WEAKENING: "GOVERNANCE_RULE_WEAKENING",
    GOVERNANCE_DEPENDENCY_REMOVAL: "GOVERNANCE_DEPENDENCY_REMOVAL",
    POLICY_ENFORCEMENT_DEGRADATION: "POLICY_ENFORCEMENT_DEGRADATION",
    GOVERNANCE_SUPPRESSION: "GOVERNANCE_SUPPRESSION_DETECTED",
    APPROVAL_WORKFLOW_DEGRADATION: "APPROVAL_WORKFLOW_DEGRADATION",
    ESCALATION_SUPPRESSION: "ESCALATION_SUPPRESSION_DETECTED",
    CERTIFICATION_AVOIDANCE: "CERTIFICATION_AVOIDANCE_DETECTED",
    PRIVILEGE_ESCALATION: "PRIVILEGE_ESCALATION_DETECTED",
    OPERATOR_AUTHORITY_REDUCTION: "OPERATOR_AUTHORITY_REDUCTION",
    UNAUTHORIZED_GOVERNANCE_EVOLUTION: "UNAUTHORIZED_GOVERNANCE_EVOLUTION",
    NONDETERMINISTIC: "NONDETERMINISTIC_ENFORCEMENT",
    NONREPLAYABLE_EVIDENCE: "NONREPLAYABLE_GOVERNANCE_EVIDENCE",
    TENANT_BREACH: "TENANT_ISOLATION_BREACH",
    UNKNOWN_BEHAVIOR: "UNKNOWN_GOVERNANCE_BEHAVIOR",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, architectureReplayable: boolean): readonly GovernanceAuthorityDriftFailure[] {
  const failures: GovernanceAuthorityDriftFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!architectureReplayable) failures.push("DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function severityFor(failures: readonly GovernanceAuthorityDriftFailure[]): DriftSeverity {
  if (failures.includes("UNKNOWN_GOVERNANCE_BEHAVIOR") || failures.includes("CONSTITUTIONAL_VIOLATION_DETECTED") || failures.includes("TENANT_ISOLATION_BREACH")) return "CRITICAL";
  if (failures.some((failure) => [
    "AUTHORITY_EXPANSION_DETECTED",
    "APPROVAL_BYPASS_ATTEMPT",
    "PRIVILEGE_ESCALATION_DETECTED",
    "OPERATOR_AUTHORITY_REDUCTION",
    "ESCALATION_SUPPRESSION_DETECTED",
    "CERTIFICATION_AVOIDANCE_DETECTED",
  ].includes(failure))) return "HIGH";
  if (failures.length) return "MODERATE";
  return "INFORMATIONAL";
}

function responseFor(severity: DriftSeverity, failures: readonly GovernanceAuthorityDriftFailure[]): DriftResponse {
  if (failures.includes("UNKNOWN_GOVERNANCE_BEHAVIOR") || severity === "CRITICAL") return "FAIL_CLOSED";
  if (severity === "HIGH") return "SUPPRESS_ADAPTATION";
  if (severity === "MODERATE") return "REQUIRE_REVIEW";
  return "MONITOR";
}

function statusFor(failures: readonly GovernanceAuthorityDriftFailure[]): GovernanceAuthorityDriftStatus {
  if (failures.includes("UNKNOWN_GOVERNANCE_BEHAVIOR") || failures.includes("CONSTITUTIONAL_VIOLATION_DETECTED") || failures.includes("TENANT_ISOLATION_BREACH")) return "FAIL_CLOSED";
  if (failures.some((failure) => [
    "AUTHORITY_EXPANSION_DETECTED",
    "APPROVAL_BYPASS_ATTEMPT",
    "PRIVILEGE_ESCALATION_DETECTED",
    "OPERATOR_AUTHORITY_REDUCTION",
    "ESCALATION_SUPPRESSION_DETECTED",
    "CERTIFICATION_AVOIDANCE_DETECTED",
  ].includes(failure))) return "CONTAINED";
  if (failures.length) return "REQUIRES_GOVERNANCE_REVIEW";
  return "PASS";
}

function score(failures: readonly GovernanceAuthorityDriftFailure[]): number {
  if (!failures.length) return 0.97;
  if (failures.includes("UNKNOWN_GOVERNANCE_BEHAVIOR") || failures.includes("CONSTITUTIONAL_VIOLATION_DETECTED")) return 0.08;
  if (failures.includes("AUTHORITY_EXPANSION_DETECTED") || failures.includes("APPROVAL_BYPASS_ATTEMPT")) return 0.18;
  return 0.54;
}

function buildBaseline(): GovernanceBaseline {
  const base: Omit<GovernanceBaseline, "integrity_hash"> = {
    baseline_id: "governance_authority_baseline_v1",
    governance_version: "governance/v1",
    constitutional_version: "constitutional/v1",
    authority_model: freezeArray(["advisory_only", "no_execution_authority", "no_policy_mutation", "operator_final_authority"]),
    approval_workflows: freezeArray(["governance_approval_required", "operator_approval_required", "certification_approval_required", "rollback_approval_required"]),
    escalation_policies: freezeArray(["constitutional_conflict_fail_closed", "authority_expansion_block", "approval_bypass_block", "unknown_governance_fail_closed"]),
    certification_requirements: freezeArray(["deterministic_replay", "evidence_integrity", "tenant_isolation", "governance_review"]),
    operator_authority: freezeArray(["final_decision_authority", "override_authority", "containment_approval", "rejection_authority"]),
    effective_date: "2026-07-11",
    approval_reference: "governance-approval:governance-authority-baseline:v1",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function automaticBlocks(failures: readonly GovernanceAuthorityDriftFailure[]): readonly string[] {
  const map: Partial<Record<GovernanceAuthorityDriftFailure, string>> = {
    GOVERNANCE_RELAXATION_DETECTED: "block_governance_reduction",
    CONSTITUTIONAL_VIOLATION_DETECTED: "block_constitutional_conflict",
    AUTHORITY_EXPANSION_DETECTED: "block_authority_expansion",
    APPROVAL_BYPASS_ATTEMPT: "block_approval_bypass",
    CERTIFICATION_AVOIDANCE_DETECTED: "block_certification_avoidance",
    ESCALATION_SUPPRESSION_DETECTED: "block_escalation_suppression",
    PRIVILEGE_ESCALATION_DETECTED: "block_privilege_escalation",
    OPERATOR_AUTHORITY_REDUCTION: "block_operator_authority_reduction",
    UNAUTHORIZED_GOVERNANCE_EVOLUTION: "block_unauthorized_governance_evolution",
    UNKNOWN_GOVERNANCE_BEHAVIOR: "block_unknown_governance_behavior",
  };
  return freezeArray(failures.map((failure) => map[failure]).filter((block): block is string => Boolean(block)));
}

function buildGovernanceReport(failures: readonly GovernanceAuthorityDriftFailure[], response: DriftResponse, blocks: readonly string[]): GovernanceDriftReport {
  const base: Omit<GovernanceDriftReport, "integrity_hash"> = {
    report_id: `governance_drift_report_${hash(failures).slice(0, 14)}`,
    detected_governance_drift: failures,
    constitutional_analysis: failures.includes("CONSTITUTIONAL_VIOLATION_DETECTED") ? "Constitutional violation detected and blocked." : "Constitutional protections remain intact.",
    approval_workflow_analysis: failures.includes("APPROVAL_BYPASS_ATTEMPT") || failures.includes("APPROVAL_WORKFLOW_DEGRADATION") ? "Approval workflow drift requires containment." : "Approval workflow remains intact.",
    escalation_analysis: failures.includes("ESCALATION_SUPPRESSION_DETECTED") ? "Escalation suppression detected and blocked." : "Escalation policy remains consistent.",
    governance_impacts: failures.length ? freezeArray(["mandatory_governance_review_required"]) : freezeArray(["no_governance_impact_detected"]),
    affected_adaptations: freezeArray(["adaptation:proposal-generation", "adaptation:policy-selection"]),
    affected_recommendations: freezeArray(["recommendation:governance-aware", "recommendation:authority-bound"]),
    supporting_evidence: freezeArray(["evidence:governance-policy", "evidence:authority-boundary", "evidence:approval-workflow", "evidence:constitutional-check"]),
    containment_actions: blocks.length ? blocks : freezeArray(["monitor_governance_integrity"]),
    recommended_responses: freezeArray([response]),
    deterministic: true,
    replayable: true,
    explainable: true,
    evidence_backed: true,
    audit_ready: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAuthorityReport(integrityScore: number, failures: readonly GovernanceAuthorityDriftFailure[], blocks: readonly string[]): AuthorityDriftReport {
  const authorityFailures = failures.filter((failure) => ["AUTHORITY_EXPANSION_DETECTED", "PRIVILEGE_ESCALATION_DETECTED", "OPERATOR_AUTHORITY_REDUCTION"].includes(failure));
  const base: Omit<AuthorityDriftReport, "integrity_hash"> = {
    report_id: `authority_drift_report_${hash({ integrityScore, failures }).slice(0, 14)}`,
    authority_drift_report: authorityFailures.length ? "Authority boundary violation detected and blocked." : "Authority boundaries remain intact.",
    boundary_integrity_assessment: authorityFailures.length ? "Boundary integrity requires governance review." : "Boundary integrity is preserved.",
    authority_violation_summary: authorityFailures.length ? authorityFailures.join(",") : "none",
    authority_integrity_score: integrityScore,
    unauthorized_permissions: authorityFailures.length ? freezeArray(["execution_authority", "policy_mutation", "approval_reassignment"]) : freezeArray([]),
    automatic_blocks: blocks,
    operator_impact: failures.includes("OPERATOR_AUTHORITY_REDUCTION") ? "Operator authority reduction was blocked." : "Operator final authority preserved.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildConstitutionalReport(failures: readonly GovernanceAuthorityDriftFailure[]): ConstitutionalComplianceReport {
  const constitutionalPreserved = !failures.includes("CONSTITUTIONAL_VIOLATION_DETECTED");
  const tenantPreserved = !failures.includes("TENANT_ISOLATION_BREACH");
  const base: Omit<ConstitutionalComplianceReport, "integrity_hash"> = {
    report_id: `constitutional_compliance_${hash(failures).slice(0, 14)}`,
    constitutional_compliance_report: constitutionalPreserved ? "Constitutional compliance preserved." : "Constitutional conflict detected and blocked.",
    constitutional_drift_assessment: constitutionalPreserved ? "No constitutional drift detected." : "Constitutional drift requires fail-closed recovery.",
    governance_supremacy_preserved: !failures.includes("GOVERNANCE_RELAXATION_DETECTED"),
    operator_supremacy_preserved: !failures.includes("OPERATOR_AUTHORITY_REDUCTION"),
    advisory_only_preserved: true,
    replay_requirements_preserved: !failures.includes("NONREPLAYABLE_GOVERNANCE_EVIDENCE"),
    audit_requirements_preserved: true,
    tenant_isolation_preserved: tenantPreserved,
    evidence_integrity_preserved: !failures.includes("NONREPLAYABLE_GOVERNANCE_EVIDENCE"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildApprovalReport(integrityScore: number, failures: readonly GovernanceAuthorityDriftFailure[], blocks: readonly string[]): ApprovalWorkflowIntegrityReport {
  const approvalFailures = failures.filter((failure) => ["APPROVAL_BYPASS_ATTEMPT", "APPROVAL_WORKFLOW_DEGRADATION"].includes(failure));
  const base: Omit<ApprovalWorkflowIntegrityReport, "integrity_hash"> = {
    report_id: `approval_integrity_${hash({ integrityScore, failures }).slice(0, 14)}`,
    approval_integrity_report: approvalFailures.length ? "Approval workflow drift detected and blocked." : "Approval workflows remain intact.",
    workflow_drift_analysis: approvalFailures.length ? "Approval sequencing or requirement degradation requires review." : "No workflow drift detected.",
    approval_integrity_score: approvalFailures.length ? 0.22 : integrityScore,
    detected_workflow_anomalies: approvalFailures,
    automatic_blocks: blocks,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEscalationReport(integrityScore: number, failures: readonly GovernanceAuthorityDriftFailure[]): EscalationIntegrityReport {
  const suppressed = failures.includes("ESCALATION_SUPPRESSION_DETECTED");
  const base: Omit<EscalationIntegrityReport, "integrity_hash"> = {
    report_id: `governance_escalation_${hash({ integrityScore, failures }).slice(0, 14)}`,
    escalation_drift_summary: suppressed ? "Escalation suppression detected and blocked." : "Escalation behavior remains aligned.",
    escalation_integrity_report: suppressed ? "Escalation integrity requires governance review." : "Escalation integrity preserved.",
    escalation_consistency_score: suppressed ? 0.24 : integrityScore,
    governance_compliance_score: failures.includes("GOVERNANCE_RELAXATION_DETECTED") ? 0.31 : integrityScore,
    constitutional_compliance_score: failures.includes("CONSTITUTIONAL_VIOLATION_DETECTED") ? 0.08 : integrityScore,
    operator_notification_score: failures.includes("OPERATOR_AUTHORITY_REDUCTION") ? 0.2 : integrityScore,
    certification_routing_score: failures.includes("CERTIFICATION_AVOIDANCE_DETECTED") ? 0.21 : integrityScore,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildContainment(failures: readonly GovernanceAuthorityDriftFailure[], blocks: readonly string[], response: DriftResponse): GovernanceContainmentDecision {
  const base: Omit<GovernanceContainmentDecision, "integrity_hash"> = {
    containment_id: `governance_containment_${hash({ failures, blocks }).slice(0, 14)}`,
    automatic_blocks: blocks,
    containment_actions: blocks.length ? freezeArray(["suspend_adaptation", "require_governance_review", "require_simulation", "require_certification", response === "FAIL_CLOSED" ? "fail_closed" : "record_immutable_evidence", "notify_operators"]) : freezeArray(["monitor_governance_integrity"]),
    mandatory_escalation_required: failures.length > 0,
    escalation_destinations: failures.length ? freezeArray(["Governance Review Board", "Constitutional Review", "Operator Review", "Adaptive Simulation", "Certification Review", "Executive Oversight", "Fail-Closed Recovery"]) : freezeArray(["Operator Review"]),
    deterministic: true,
    replayable: true,
    explainable: true,
    auditable: true,
    governance_approved_path_required: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMandatoryEscalation(failures: readonly GovernanceAuthorityDriftFailure[], containment: GovernanceContainmentDecision): MandatoryEscalation {
  const base: Omit<MandatoryEscalation, "integrity_hash"> = {
    escalation_id: `mandatory_governance_escalation_${hash(failures).slice(0, 14)}`,
    triggers: failures.length ? failures : freezeArray(["none"]),
    destinations: containment.escalation_destinations,
    required: containment.mandatory_escalation_required,
    fail_closed_recovery_available: true,
    operator_notification_required: true,
    certification_review_required: failures.includes("CERTIFICATION_AVOIDANCE_DETECTED") || failures.includes("CONSTITUTIONAL_VIOLATION_DETECTED") || failures.includes("UNKNOWN_GOVERNANCE_BEHAVIOR"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecord(input: GovernanceAuthorityInput, baseline: GovernanceBaseline, report: GovernanceDriftReport, containment: GovernanceContainmentDecision, failures: readonly GovernanceAuthorityDriftFailure[]): GovernanceDriftRecord {
  const severity = severityFor(failures);
  const base: Omit<GovernanceDriftRecord, "integrity_hash"> = {
    drift_id: `governance_authority_drift_${hash({ tenant: input.tenant_id ?? "tenant-mission-control", failures }).slice(0, 16)}`,
    tenant_id: input.tenant_id ?? "tenant-mission-control",
    baseline_ref: baseline.integrity_hash,
    governance_version: baseline.governance_version,
    constitutional_version: baseline.constitutional_version,
    drift_category: "GOVERNANCE_AUTHORITY_DRIFT",
    severity,
    authority_impact: failures.includes("AUTHORITY_EXPANSION_DETECTED") ? "authority_expansion_blocked" : "authority_preserved",
    governance_impact: failures.length ? "governance_review_required" : "governance_preserved",
    constitutional_impact: failures.includes("CONSTITUTIONAL_VIOLATION_DETECTED") ? "constitutional_violation_blocked" : "constitutional_preserved",
    approval_workflow_impact: failures.includes("APPROVAL_BYPASS_ATTEMPT") ? "approval_bypass_blocked" : "approval_workflow_preserved",
    escalation_impact: failures.includes("ESCALATION_SUPPRESSION_DETECTED") ? "escalation_suppression_blocked" : "escalation_preserved",
    affected_adaptations: report.affected_adaptations,
    affected_decisions: freezeArray(["decision:authority-boundary", "decision:governance-escalation"]),
    automatic_blocks: containment.automatic_blocks,
    recommended_response: responseFor(severity, failures),
    containment_actions: containment.containment_actions,
    supporting_evidence: report.integrity_hash,
    replay_refs: freezeArray(["replay:governance-authority-drift-defense"]),
    timestamp: DEFENSE_TIMESTAMP,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(authority: AuthorityDriftReport, approval: ApprovalWorkflowIntegrityReport, escalation: EscalationIntegrityReport, containment: GovernanceContainmentDecision, constitutional: ConstitutionalComplianceReport, failures: readonly GovernanceAuthorityDriftFailure[]): GovernanceAuthorityMetrics {
  const base: Omit<GovernanceAuthorityMetrics, "integrity_hash"> = {
    authority_integrity_score: authority.authority_integrity_score,
    approval_integrity_score: approval.approval_integrity_score,
    escalation_integrity_score: escalation.escalation_consistency_score,
    containment_blocks_count: containment.automatic_blocks.length,
    mandatory_escalation_required: containment.mandatory_escalation_required,
    deterministic_enforcement: !failures.includes("NONDETERMINISTIC_ENFORCEMENT"),
    replayable_enforcement: !failures.includes("NONREPLAYABLE_GOVERNANCE_EVIDENCE"),
    governance_preserved: !failures.includes("GOVERNANCE_RELAXATION_DETECTED") && !failures.includes("GOVERNANCE_RULE_WEAKENING"),
    constitutional_preserved: constitutional.governance_supremacy_preserved && constitutional.operator_supremacy_preserved && constitutional.tenant_isolation_preserved && !failures.includes("CONSTITUTIONAL_VIOLATION_DETECTED"),
    operator_authority_preserved: !failures.includes("OPERATOR_AUTHORITY_REDUCTION"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_BREACH"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<GovernanceAuthorityResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    architecture_hash: result.architecture_result.integrity_hash,
    baseline_hash: result.baseline.integrity_hash,
    governance_hash: result.governance_report.integrity_hash,
    authority_hash: result.authority_report.integrity_hash,
    constitutional_hash: result.constitutional_report.integrity_hash,
    approval_hash: result.approval_report.integrity_hash,
    escalation_hash: result.escalation_report.integrity_hash,
    containment_hash: result.containment_decision.integrity_hash,
    record_hash: result.drift_record.integrity_hash,
    mandatory_escalation_hash: result.mandatory_escalation.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<GovernanceAuthorityResult, "integrity_hash">): string {
  return hash({
    version: result.governance_authority_drift_defense_version,
    defense_identifier: result.defense_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    record_hash: result.drift_record.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function defendGovernanceAuthority(input: GovernanceAuthorityInput = {}): GovernanceAuthorityResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const architecture_result = input.architecture_result ?? establishDriftDefenseArchitecture();
  const failures = collectFailures(scenario, replayDriftDefenseArchitecture(architecture_result));
  const integrityScore = score(failures);
  const severity = severityFor(failures);
  const response = responseFor(severity, failures);
  const blocks = automaticBlocks(failures);
  const baseline = buildBaseline();
  const governance_report = buildGovernanceReport(failures, response, blocks);
  const authority_report = buildAuthorityReport(integrityScore, failures, blocks);
  const constitutional_report = buildConstitutionalReport(failures);
  const approval_report = buildApprovalReport(integrityScore, failures, blocks);
  const escalation_report = buildEscalationReport(integrityScore, failures);
  const containment_decision = buildContainment(failures, blocks, response);
  const mandatory_escalation = buildMandatoryEscalation(failures, containment_decision);
  const drift_record = buildRecord(input, baseline, governance_report, containment_decision, failures);
  const metrics = buildMetrics(authority_report, approval_report, escalation_report, containment_decision, constitutional_report, failures);
  const base: Omit<GovernanceAuthorityResult, "integrity_hash" | "replay_hash"> = {
    governance_authority_drift_defense_version: DEFENSE_VERSION,
    defense_identifier: DEFENSE_IDENTIFIER,
    status: statusFor(failures),
    api_surface,
    architecture_result,
    baseline,
    governance_report,
    authority_report,
    constitutional_report,
    approval_report,
    escalation_report,
    containment_decision,
    drift_record,
    mandatory_escalation,
    metrics,
    failures,
    deterministic: metrics.deterministic_enforcement,
    replayable: metrics.replayable_enforcement,
    explainable: !failures.includes("UNKNOWN_GOVERNANCE_BEHAVIOR"),
    evidence_backed: !failures.includes("NONREPLAYABLE_GOVERNANCE_EVIDENCE"),
    governance_preserved: metrics.governance_preserved,
    constitutional_preserved: metrics.constitutional_preserved,
    operator_authority_preserved: metrics.operator_authority_preserved,
    tenant_isolated: metrics.tenant_isolated,
    advisory_only: true,
    expands_authority: false,
    authorizes_autonomous_execution: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayGovernanceAuthorityDefense(result: GovernanceAuthorityResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayDriftDefenseArchitecture(result.architecture_result) &&
    verifyHashedRecord(result.baseline) &&
    verifyHashedRecord(result.governance_report) &&
    verifyHashedRecord(result.authority_report) &&
    verifyHashedRecord(result.constitutional_report) &&
    verifyHashedRecord(result.approval_report) &&
    verifyHashedRecord(result.escalation_report) &&
    verifyHashedRecord(result.containment_decision) &&
    verifyHashedRecord(result.drift_record) &&
    verifyHashedRecord(result.mandatory_escalation) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getGovernanceAuthorityFoundation(): GovernanceAuthorityFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    governance_authority_drift_defense_version: DEFENSE_VERSION,
    api_surface,
    result: defendGovernanceAuthority(),
  });
}

export const GovernanceAuthorityDriftDefense = Object.freeze({
  defend: defendGovernanceAuthority,
  replay: replayGovernanceAuthorityDefense,
});
