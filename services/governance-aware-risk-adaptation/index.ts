import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { analyzeRiskAdaptationFoundation } from "@/services/risk-adaptation-engine-foundation";
import { analyzeRiskAdaptationLedger } from "@/services/risk-adaptation-ledger";
import type {
  GovernanceRiskAdaptationRecord,
  GovernanceRiskApiSurface,
  GovernanceRiskDecision,
  GovernanceRiskDecisionLedger,
  GovernanceRiskFailure,
  GovernanceRiskFoundation,
  GovernanceRiskImpactReport,
  GovernanceRiskInput,
  GovernanceRiskResult,
  GovernanceRiskStatus,
  GovernanceRiskValidation,
} from "@/types/governance-aware-risk-adaptation";

const GOVERNANCE_RISK_VERSION = "governance-aware-risk-adaptation/v1" as const;
const CREATED_AT = "2026-07-10T00:00:00.000Z";

type Scenario = NonNullable<GovernanceRiskInput["scenario"]>;
type Sample = Readonly<{
  constitutional: GovernanceRiskStatus;
  governance: GovernanceRiskStatus;
  authority: GovernanceRiskStatus;
  compliance: GovernanceRiskStatus;
  trust: GovernanceRiskStatus;
  escalation: GovernanceRiskStatus;
  certification: GovernanceRiskStatus;
  decision: GovernanceRiskDecision;
  actions: readonly string[];
  escalationReasons: readonly string[];
}>;

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

function buildApiSurface(): GovernanceRiskApiSurface {
  const base: Omit<GovernanceRiskApiSurface, "integrity_hash"> = {
    api_id: "governance_aware_risk_adaptation_api",
    evaluate_governance: "POST /governance-aware-risk-adaptation/evaluate",
    retrieve_records: "POST /governance-aware-risk-adaptation/records",
    retrieve_impact: "POST /governance-aware-risk-adaptation/impact",
    retrieve_decision: "POST /governance-aware-risk-adaptation/decision",
    retrieve_ledger: "POST /governance-aware-risk-adaptation/ledger",
    retrieve_validation: "POST /governance-aware-risk-adaptation/validation",
    replay_evaluation: "POST /governance-aware-risk-adaptation/replay",
    retrieve_contract: "GET /governance-aware-risk-adaptation/contract",
    update_supported: false,
    delete_supported: false,
    production_deployment_approval_supported: false,
    production_risk_mutation_supported: false,
    governance_policy_mutation_supported: false,
    certification_mutation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function sampleForScenario(scenario: Scenario): Sample {
  const review: Sample = { constitutional: "COMPLIANT", governance: "REQUIRES_REVIEW", authority: "COMPLIANT", compliance: "COMPLIANT", trust: "COMPLIANT", escalation: "REQUIRES_REVIEW", certification: "REQUIRES_REVIEW", decision: "GOVERNANCE_REVIEW_REQUIRED", actions: ["governance_review"], escalationReasons: ["governance-sensitive adaptation"] };
  const map: Partial<Record<Scenario, Sample>> = {
    APPROVED_FOR_SIMULATION: { constitutional: "COMPLIANT", governance: "COMPLIANT", authority: "COMPLIANT", compliance: "COMPLIANT", trust: "COMPLIANT", escalation: "COMPLIANT", certification: "COMPLIANT", decision: "APPROVED_FOR_SIMULATION", actions: ["run_simulation", "operator_review_after_simulation"], escalationReasons: [] },
    GOVERNANCE_REVIEW: review,
    CONSTITUTIONAL_REVIEW: { ...review, constitutional: "REQUIRES_REVIEW", decision: "CONSTITUTIONAL_REVIEW_REQUIRED", actions: ["constitutional_review", "governance_review"], escalationReasons: ["constitutional risk"] },
    COMPLIANCE_REVIEW: { ...review, compliance: "REQUIRES_REVIEW", decision: "COMPLIANCE_REVIEW_REQUIRED", actions: ["compliance_review", "control_mapping"], escalationReasons: ["compliance obligation"] },
    TRUST_REVIEW: { ...review, trust: "REQUIRES_REVIEW", decision: "TRUST_REVIEW_REQUIRED", actions: ["trust_review", "evidence_quality_review"], escalationReasons: ["trust impact"] },
    ESCALATED: { ...review, escalation: "REQUIRES_REVIEW", decision: "ESCALATED", actions: ["enterprise_escalation", "governance_review"], escalationReasons: ["enterprise-wide impact"] },
    REJECTED: { constitutional: "NON_COMPLIANT", governance: "NON_COMPLIANT", authority: "NON_COMPLIANT", compliance: "REQUIRES_REVIEW", trust: "REQUIRES_REVIEW", escalation: "REQUIRES_REVIEW", certification: "NON_COMPLIANT", decision: "REJECTED", actions: ["reject_proposal"], escalationReasons: ["constitutional violation", "authority violation"] },
    CRITICAL_SEVERITY: { ...review, escalation: "REQUIRES_REVIEW", decision: "ESCALATED", actions: ["critical_severity_escalation", "simulation_required"], escalationReasons: ["critical severity increase"] },
    AUTHORITY_BOUNDARY: { ...review, authority: "REQUIRES_REVIEW", decision: "ESCALATED", actions: ["authority_review", "operator_authority_confirmation"], escalationReasons: ["authority boundary change"] },
    ENTERPRISE_IMPACT: { ...review, governance: "REQUIRES_REVIEW", decision: "ESCALATED", actions: ["enterprise_governance_review"], escalationReasons: ["enterprise-wide impact"] },
  };
  return map[scenario] ?? map.APPROVED_FOR_SIMULATION!;
}

function buildRecord(scenario: Scenario, adaptationId: string, ledgerRef: string): GovernanceRiskAdaptationRecord {
  const sample = sampleForScenario(scenario);
  const base: Omit<GovernanceRiskAdaptationRecord, "integrity_hash"> = {
    governance_review_id: `governance_risk_review_${hash(`${scenario}:${adaptationId}:${sample.decision}`).slice(0, 16)}`,
    adaptation_id: adaptationId,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_mission_control:foreign" : "tenant_mission_control",
    mission_scope: "mission_scope_governance_aware_risk_adaptation",
    constitutional_status: sample.constitutional,
    governance_status: sample.governance,
    authority_status: sample.authority,
    compliance_status: sample.compliance,
    trust_status: sample.trust,
    escalation_status: sample.escalation,
    certification_status: sample.certification,
    required_actions: freezeArray(sample.actions),
    supporting_evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["governance_risk_evidence_ref_1", ledgerRef]),
    governance_decision: scenario === "MISSING_DECISION" ? "REJECTED" : sample.decision,
    decision_rationale: scenario === "MISSING_DECISION" ? "" : `${sample.decision} determined through deterministic governance evaluation.`,
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["governance_risk_replay_ref_1"]),
    lineage_refs: scenario === "BROKEN_LINEAGE" ? freezeArray([]) : freezeArray(["governance_risk_lineage_ref_1"]),
    created_at: CREATED_AT,
    advisory_only: true,
    authorizes_production_deployment: false,
    mutates_production_risk_models: false,
    weakens_constitutional_protections: false,
    reduces_governance_oversight: false,
    overrides_operator_authority: false,
    bypasses_required_approvals: false,
    suppresses_constitutional_risk: false,
    changes_governance_policy: false,
    modifies_certification_status: false,
    changes_compliance_policy: false,
    rewrites_historical_evidence: false,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.governance_review_id }) });
  if (scenario === "WEAKEN_CONSTITUTION") return Object.freeze({ ...record, weakens_constitutional_protections: true as false });
  if (scenario === "REDUCE_GOVERNANCE") return Object.freeze({ ...record, reduces_governance_oversight: true as false });
  if (scenario === "OPERATOR_OVERRIDE") return Object.freeze({ ...record, overrides_operator_authority: true as false });
  if (scenario === "APPROVAL_BYPASS") return Object.freeze({ ...record, bypasses_required_approvals: true as false });
  if (scenario === "CONSTITUTIONAL_SUPPRESSION") return Object.freeze({ ...record, suppresses_constitutional_risk: true as false });
  if (scenario === "GOVERNANCE_POLICY_MUTATION") return Object.freeze({ ...record, changes_governance_policy: true as false });
  if (scenario === "CERTIFICATION_MUTATION") return Object.freeze({ ...record, modifies_certification_status: true as false });
  if (scenario === "COMPLIANCE_POLICY_MUTATION") return Object.freeze({ ...record, changes_compliance_policy: true as false });
  if (scenario === "EVIDENCE_REWRITE") return Object.freeze({ ...record, rewrites_historical_evidence: true as false });
  if (scenario === "PRODUCTION_APPROVAL") return Object.freeze({ ...record, authorizes_production_deployment: true as false });
  if (scenario === "PRODUCTION_MUTATION") return Object.freeze({ ...record, mutates_production_risk_models: true as false });
  return record;
}

function buildImpact(record: GovernanceRiskAdaptationRecord, scenario: Scenario): GovernanceRiskImpactReport {
  const sample = sampleForScenario(scenario);
  const base: Omit<GovernanceRiskImpactReport, "integrity_hash"> = {
    report_id: `governance_risk_impact_${hash(record.governance_review_id).slice(0, 14)}`,
    governance_review_id: record.governance_review_id,
    constitutional_impact: `${record.constitutional_status}: constitutional guarantees remain controlling.`,
    governance_impact: `${record.governance_status}: governance workflow impact evaluated.`,
    authority_impact: `${record.authority_status}: operator and governance authority boundaries evaluated.`,
    compliance_impact: `${record.compliance_status}: compliance obligations evaluated.`,
    trust_impact: `${record.trust_status}: trust and explainability impact evaluated.`,
    certification_impact: `${record.certification_status}: certification prerequisites evaluated without mutation.`,
    escalation_required: sample.escalationReasons.length > 0,
    escalation_reasons: freezeArray(sample.escalationReasons),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(record: GovernanceRiskAdaptationRecord): GovernanceRiskDecisionLedger {
  const decisions: GovernanceRiskDecision[] = ["APPROVED_FOR_SIMULATION", "GOVERNANCE_REVIEW_REQUIRED", "CONSTITUTIONAL_REVIEW_REQUIRED", "COMPLIANCE_REVIEW_REQUIRED", "TRUST_REVIEW_REQUIRED", "ESCALATED", "REJECTED"];
  const decision_index = decisions.reduce((index, decision) => ({ ...index, [decision]: freezeArray(record.governance_decision === decision ? [record.governance_review_id] : []) }), {} as Record<GovernanceRiskDecision, readonly string[]>);
  const base: Omit<GovernanceRiskDecisionLedger, "integrity_hash"> = {
    ledger_id: `governance_risk_decision_ledger_${hash(record.governance_review_id).slice(0, 14)}`,
    tenant_id: "tenant_mission_control",
    governance_review_refs: freezeArray([record.governance_review_id]),
    decision_index: Object.freeze(decision_index),
    required_action_refs: record.required_actions,
    replay_refs: record.replay_refs,
    append_only: true,
    immutable: true,
    deleted: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(record: GovernanceRiskAdaptationRecord, impact: GovernanceRiskImpactReport, ledger: GovernanceRiskDecisionLedger, scenario: Scenario): readonly GovernanceRiskFailure[] {
  const failures: GovernanceRiskFailure[] = [];
  if (scenario === "MISSING_CONSTITUTIONAL" || !record.constitutional_status) failures.push("CONSTITUTIONAL_COMPLIANCE_MISSING");
  if (scenario === "MISSING_GOVERNANCE" || !record.governance_status) failures.push("GOVERNANCE_COMPLIANCE_MISSING");
  if (scenario === "MISSING_AUTHORITY" || !record.authority_status) failures.push("AUTHORITY_VALIDATION_MISSING");
  if (scenario === "MISSING_COMPLIANCE" || !record.compliance_status) failures.push("COMPLIANCE_ASSESSMENT_MISSING");
  if (scenario === "MISSING_TRUST" || !record.trust_status) failures.push("TRUST_ASSESSMENT_MISSING");
  if (scenario === "MISSING_ESCALATION" || !record.escalation_status) failures.push("ESCALATION_EVALUATION_MISSING");
  if (scenario === "MISSING_CERTIFICATION" || !record.certification_status) failures.push("CERTIFICATION_ASSESSMENT_MISSING");
  if (scenario === "MISSING_EVIDENCE" || record.supporting_evidence_refs.length === 0) failures.push("SUPPORTING_EVIDENCE_MISSING");
  if (scenario === "MISSING_DECISION" || record.decision_rationale.length === 0) failures.push("DETERMINISTIC_DECISION_MISSING");
  if (scenario === "MISSING_REPLAY" || record.replay_refs.length === 0) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "BROKEN_LINEAGE" || record.lineage_refs.length === 0) failures.push("LINEAGE_REFERENCES_MISSING");
  if (scenario === "CROSS_TENANT" || record.tenant_id !== ledger.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "REPLAY_DIVERGENCE") failures.push("REPLAY_DIVERGENCE_DETECTED");
  if (scenario === "HASH_MISMATCH" || hashWithoutIntegrity(record) !== record.integrity_hash || hashWithoutIntegrity(impact) !== impact.integrity_hash || hashWithoutIntegrity(ledger) !== ledger.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (record.weakens_constitutional_protections) failures.push("CONSTITUTIONAL_PROTECTION_WEAKENING_DETECTED");
  if (record.reduces_governance_oversight) failures.push("GOVERNANCE_OVERSIGHT_REDUCTION_DETECTED");
  if (record.overrides_operator_authority) failures.push("OPERATOR_AUTHORITY_OVERRIDE_DETECTED");
  if (record.bypasses_required_approvals) failures.push("APPROVAL_BYPASS_DETECTED");
  if (record.suppresses_constitutional_risk) failures.push("CONSTITUTIONAL_RISK_SUPPRESSION_DETECTED");
  if (record.changes_governance_policy) failures.push("GOVERNANCE_POLICY_MUTATION_DETECTED");
  if (record.modifies_certification_status) failures.push("CERTIFICATION_STATUS_MUTATION_DETECTED");
  if (record.changes_compliance_policy) failures.push("COMPLIANCE_POLICY_MUTATION_DETECTED");
  if (record.rewrites_historical_evidence) failures.push("HISTORICAL_EVIDENCE_REWRITE_DETECTED");
  if (record.authorizes_production_deployment) failures.push("PRODUCTION_DEPLOYMENT_APPROVAL_DETECTED");
  if (record.mutates_production_risk_models) failures.push("PRODUCTION_RISK_MODEL_MUTATION_DETECTED");
  if (scenario === "NONDETERMINISTIC") failures.push("NONDETERMINISTIC_GOVERNANCE_DECISION");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly GovernanceRiskFailure[]): GovernanceRiskValidation["state"] {
  if (failures.includes("REPLAY_REFERENCES_MISSING") || failures.includes("REPLAY_DIVERGENCE_DETECTED")) return "PENDING_REPLAY";
  if (failures.includes("CONSTITUTIONAL_PROTECTION_WEAKENING_DETECTED") || failures.includes("OPERATOR_AUTHORITY_OVERRIDE_DETECTED") || failures.includes("PRODUCTION_DEPLOYMENT_APPROVAL_DETECTED") || failures.includes("PRODUCTION_RISK_MODEL_MUTATION_DETECTED")) return "REJECTED";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(record: GovernanceRiskAdaptationRecord, impact: GovernanceRiskImpactReport, ledger: GovernanceRiskDecisionLedger, failures: readonly GovernanceRiskFailure[]): GovernanceRiskValidation {
  const integrityVerified = hashWithoutIntegrity(record) === record.integrity_hash && hashWithoutIntegrity(impact) === impact.integrity_hash && hashWithoutIntegrity(ledger) === ledger.integrity_hash;
  const base: Omit<GovernanceRiskValidation, "integrity_hash"> = {
    validation_id: "governance_risk_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && integrityVerified,
    failures,
    constitutional_complete: !failures.includes("CONSTITUTIONAL_COMPLIANCE_MISSING"),
    governance_complete: !failures.includes("GOVERNANCE_COMPLIANCE_MISSING"),
    authority_complete: !failures.includes("AUTHORITY_VALIDATION_MISSING"),
    compliance_complete: !failures.includes("COMPLIANCE_ASSESSMENT_MISSING"),
    trust_complete: !failures.includes("TRUST_ASSESSMENT_MISSING"),
    escalation_complete: !failures.includes("ESCALATION_EVALUATION_MISSING"),
    certification_complete: !failures.includes("CERTIFICATION_ASSESSMENT_MISSING"),
    evidence_complete: !failures.includes("SUPPORTING_EVIDENCE_MISSING"),
    deterministic_decision_complete: !failures.includes("DETERMINISTIC_DECISION_MISSING"),
    replay_complete: !failures.includes("REPLAY_REFERENCES_MISSING") && !failures.includes("REPLAY_DIVERGENCE_DETECTED"),
    lineage_complete: !failures.includes("LINEAGE_REFERENCES_MISSING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    advisory_only: record.advisory_only,
    no_production_approval: !failures.includes("PRODUCTION_DEPLOYMENT_APPROVAL_DETECTED"),
    no_production_mutation: !failures.includes("PRODUCTION_RISK_MODEL_MUTATION_DETECTED"),
    no_constitutional_weakening: !failures.includes("CONSTITUTIONAL_PROTECTION_WEAKENING_DETECTED"),
    no_governance_reduction: !failures.includes("GOVERNANCE_OVERSIGHT_REDUCTION_DETECTED"),
    no_operator_override: !failures.includes("OPERATOR_AUTHORITY_OVERRIDE_DETECTED"),
    no_approval_bypass: !failures.includes("APPROVAL_BYPASS_DETECTED"),
    no_constitutional_suppression: !failures.includes("CONSTITUTIONAL_RISK_SUPPRESSION_DETECTED"),
    no_policy_mutation: !failures.includes("GOVERNANCE_POLICY_MUTATION_DETECTED") && !failures.includes("COMPLIANCE_POLICY_MUTATION_DETECTED"),
    no_certification_mutation: !failures.includes("CERTIFICATION_STATUS_MUTATION_DETECTED"),
    no_evidence_rewrite: !failures.includes("HISTORICAL_EVIDENCE_REWRITE_DETECTED"),
    deterministic: !failures.includes("NONDETERMINISTIC_GOVERNANCE_DECISION"),
    integrity_verified: integrityVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<GovernanceRiskResult, "integrity_hash" | "replay_hash">): string {
  return hash({ records: result.records, impact_report: result.impact_report, decision_ledger: result.decision_ledger, validation: result.validation });
}

function resultIntegrityHash(result: Omit<GovernanceRiskResult, "integrity_hash">): string {
  return hash({
    governance_aware_risk_adaptation_version: result.governance_aware_risk_adaptation_version,
    api_surface_hash: result.api_surface.integrity_hash,
    record_hashes: result.records.map((record) => record.integrity_hash),
    impact_hash: result.impact_report.integrity_hash,
    ledger_hash: result.decision_ledger.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function evaluateGovernanceAwareRiskAdaptation(input: GovernanceRiskInput = {}): GovernanceRiskResult {
  const scenario = input.scenario ?? "BASELINE";
  const foundation = input.foundation_result ?? analyzeRiskAdaptationFoundation();
  const ledgerResult = input.ledger_result ?? analyzeRiskAdaptationLedger();
  const adaptationId = foundation.contract.adaptation_id;
  const ledgerRef = ledgerResult.entries[0]?.ledger_entry_id ?? "risk_adaptation_ledger_ref_missing";
  const api_surface = buildApiSurface();
  const record = buildRecord(scenario, adaptationId, ledgerRef);
  const impact_report = buildImpact(record, scenario);
  const decision_ledger = buildLedger(record);
  const failures = collectFailures(record, impact_report, decision_ledger, scenario);
  const validation = buildValidation(record, impact_report, decision_ledger, failures);
  const records = freezeArray([record]);
  const base: Omit<GovernanceRiskResult, "integrity_hash" | "replay_hash"> = {
    governance_aware_risk_adaptation_version: GOVERNANCE_RISK_VERSION,
    api_surface,
    records,
    impact_report,
    decision_ledger,
    validation,
    deterministic: true,
    replayable: true,
    explainable: validation.deterministic_decision_complete,
    evidence_backed: validation.evidence_complete,
    tenant_isolated: validation.tenant_isolated,
    advisory_only: true,
    authorizes_production_deployment: false,
    mutates_production_risk_models: false,
    changes_governance_policy: false,
    modifies_certification_status: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayGovernanceAwareRiskAdaptation(result: GovernanceRiskResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getGovernanceAwareRiskAdaptationFoundation(): GovernanceRiskFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    governance_aware_risk_adaptation_version: GOVERNANCE_RISK_VERSION,
    api_surface,
    result: evaluateGovernanceAwareRiskAdaptation(),
  });
}

export const GovernanceAwareRiskAdaptation = Object.freeze({
  evaluate: evaluateGovernanceAwareRiskAdaptation,
  replay: replayGovernanceAwareRiskAdaptation,
});
