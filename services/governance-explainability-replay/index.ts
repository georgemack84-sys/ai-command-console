import { detectAdaptivePolicyConflicts } from "@/services/adaptive-policy-conflict-detector";
import { validateAuthorityBoundary } from "@/services/authority-boundary-validator";
import { validateConstitutionalAdaptation } from "@/services/constitutional-adaptation-validator";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { determineEscalationRestriction } from "@/services/escalation-restriction-engine";
import { validateEvidenceCertification } from "@/services/evidence-certification-validator";
import { appendGovernanceAdaptationLedger } from "@/services/governance-adaptation-ledger";
import { validateGovernanceAdaptation } from "@/services/governance-adaptation-validator";
import { analyzeRiskAdaptationFoundation } from "@/services/risk-adaptation-engine-foundation";
import { validateTenantIsolation } from "@/services/tenant-isolation-validator";
import type {
  GovernanceAdaptationValidation,
  GovernanceEvidenceAttribution,
  GovernanceExplainabilityLedgerEntry,
  GovernanceExplainabilityReplayApiSurface,
  GovernanceExplainabilityReplayFailure,
  GovernanceExplainabilityReplayFoundation,
  GovernanceExplainabilityReplayInput,
  GovernanceExplainabilityReplayResult,
  GovernanceExplainabilityReplayState,
  GovernanceReplayTraceStep,
  GovernanceReplayVerificationReport,
} from "@/types/governance-explainability-replay";

const EXPLAINABILITY_VERSION = "governance-explainability-replay/v1" as const;
const VALIDATION_TIMESTAMP = "2026-07-10T00:00:00.000Z";
type Scenario = NonNullable<GovernanceExplainabilityReplayInput["scenario"]>;

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

function buildApiSurface(): GovernanceExplainabilityReplayApiSurface {
  const base: Omit<GovernanceExplainabilityReplayApiSurface, "integrity_hash"> = {
    api_id: "governance_explainability_replay_api",
    explain_governance: "POST /governance-explainability-replay/explain",
    retrieve_validation: "POST /governance-explainability-replay/validation",
    retrieve_policy_attribution: "POST /governance-explainability-replay/policy-attribution",
    retrieve_constitutional_reasoning: "POST /governance-explainability-replay/constitutional-reasoning",
    retrieve_authority_explanation: "POST /governance-explainability-replay/authority-explanation",
    retrieve_evidence_attribution: "POST /governance-explainability-replay/evidence-attribution",
    retrieve_escalation_restriction: "POST /governance-explainability-replay/escalation-restriction",
    retrieve_replay_trace: "POST /governance-explainability-replay/replay-trace",
    retrieve_replay_verification: "POST /governance-explainability-replay/replay-verification",
    retrieve_ledger: "POST /governance-explainability-replay/ledger",
    replay_explanation: "POST /governance-explainability-replay/replay",
    retrieve_contract: "GET /governance-explainability-replay/contract",
    new_governance_decisions_supported: false,
    advisory_only: true,
    fail_open_supported: false,
    byte_identical_replay_required: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureFor(scenario: Scenario): GovernanceExplainabilityReplayFailure | undefined {
  const map: Partial<Record<Scenario, GovernanceExplainabilityReplayFailure>> = {
    MISSING_GOVERNANCE_EVIDENCE: "GOVERNANCE_EVIDENCE_MISSING",
    UNKNOWN_CONSTITUTIONAL_IMPLICATIONS: "CONSTITUTIONAL_IMPLICATIONS_UNKNOWN",
    MISSING_REPLAY_CAPABILITY: "REPLAY_CAPABILITY_MISSING",
    UNCLEAR_AUTHORITY_IMPACT: "AUTHORITY_IMPACT_UNCLEAR",
    TENANT_BOUNDARY_RISK: "TENANT_BOUNDARY_RISK_EXISTS",
    TENANT_RISK: "TENANT_BOUNDARY_RISK_EXISTS",
    PROHIBITED_DOMAIN: "PROHIBITED_DOMAIN_AFFECTED",
    OPERATOR_VISIBILITY_REDUCTION: "OPERATOR_VISIBILITY_REDUCED",
    AUDITABILITY_WEAKENED: "AUDITABILITY_WEAKENED",
    AUDIT_DEGRADATION: "AUDITABILITY_WEAKENED",
    HISTORICAL_TRUTH_MUTATION: "HISTORICAL_TRUTH_MUTATED",
    EXECUTION_CHANGE_WITHOUT_APPROVAL: "EXECUTION_BEHAVIOR_CHANGED_WITHOUT_APPROVAL",
    INCOMPLETE_GOVERNANCE_LINEAGE: "GOVERNANCE_LINEAGE_INCOMPLETE",
    NONDETERMINISTIC_CONSTITUTIONAL_VALIDATION: "CONSTITUTIONAL_VALIDATION_NONDETERMINISTIC",
    UNRESOLVED_APPROVAL_REQUIREMENTS: "APPROVAL_REQUIREMENTS_UNRESOLVED",
    ROLLBACK_UNAVAILABLE: "ROLLBACK_PATH_UNAVAILABLE",
    EVIDENCE_INTEGRITY_FAILURE: "EVIDENCE_INTEGRITY_FAILED",
    LEDGER_INTEGRITY_FAILURE: "GOVERNANCE_LEDGER_INTEGRITY_FAILED",
    REPLAY_DIVERGENCE: "DETERMINISTIC_REPLAY_DIVERGED",
    REPLAY_DEGRADATION: "DETERMINISTIC_REPLAY_DIVERGED",
    UNRESOLVED_CERTIFICATION_DEPENDENCIES: "CERTIFICATION_DEPENDENCIES_UNRESOLVED",
    EXPLANATION_GENERATION_FAILURE: "GOVERNANCE_EXPLANATION_GENERATION_FAILED",
    INCOMPLETE_EVIDENCE_ATTRIBUTION: "EVIDENCE_ATTRIBUTION_INCOMPLETE",
    INCONSISTENT_REPLAY_METADATA: "REPLAY_METADATA_INCONSISTENT",
    HASH_MISMATCH: "INTEGRITY_VERIFICATION_FAILED",
  };
  return map[scenario];
}

function escalationScenarioFor(scenario: Scenario): GovernanceExplainabilityReplayInput["scenario"] {
  const map: Partial<Record<Scenario, GovernanceExplainabilityReplayInput["scenario"]>> = {
    REQUIRES_OPERATOR_REVIEW: "OPERATOR_REVIEW_REQUIRED",
    REQUIRES_GOVERNANCE_REVIEW: "GOVERNANCE_REVIEW_REQUIRED",
    REQUIRES_CONSTITUTIONAL_REVIEW: "CONSTITUTIONAL_REVIEW_REQUIRED",
  };
  return map[scenario] ?? scenario;
}

function buildChain(input: GovernanceExplainabilityReplayInput) {
  const scenario = input.scenario ?? "BASELINE";
  const escalationScenario = escalationScenarioFor(scenario);
  const adaptation = input.adaptation_result ?? analyzeRiskAdaptationFoundation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined });
  const governance = input.governance_result ?? validateGovernanceAdaptation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation });
  const constitutional = input.constitutional_result ?? validateConstitutionalAdaptation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance });
  const authority = input.authority_result ?? validateAuthorityBoundary({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional });
  const tenant = input.tenant_result ?? validateTenantIsolation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional, authority_result: authority });
  const conflict = input.conflict_result ?? detectAdaptivePolicyConflicts({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional, authority_result: authority, tenant_result: tenant });
  const ledger = input.ledger_result ?? appendGovernanceAdaptationLedger({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional, authority_result: authority, tenant_result: tenant, conflict_result: conflict });
  const evidence = input.evidence_result ?? validateEvidenceCertification({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional, authority_result: authority, tenant_result: tenant, conflict_result: conflict, ledger_result: ledger });
  const escalation = input.escalation_result ?? determineEscalationRestriction({ scenario: escalationScenario === "BASELINE" ? "BASELINE" : escalationScenario as never, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional, authority_result: authority, tenant_result: tenant, conflict_result: conflict, ledger_result: ledger, evidence_result: evidence });
  return { adaptation, governance, constitutional, authority, tenant, conflict, ledger, evidence, escalation };
}

function stateFromEscalation(finalDecision: string): GovernanceExplainabilityReplayState {
  if (finalDecision === "APPROVED_FOR_SIMULATION") return "APPROVED_FOR_SIMULATION";
  if (finalDecision === "OPERATOR_REVIEW_REQUIRED") return "REQUIRES_OPERATOR_REVIEW";
  if (finalDecision === "GOVERNANCE_REVIEW_REQUIRED") return "REQUIRES_GOVERNANCE_REVIEW";
  if (finalDecision === "CONSTITUTIONAL_REVIEW_REQUIRED" || finalDecision === "MULTI_LEVEL_REVIEW_REQUIRED") return "REQUIRES_CONSTITUTIONAL_REVIEW";
  if (finalDecision === "RESTRICTED") return "RESTRICTED";
  if (finalDecision === "REJECTED") return "REJECTED";
  return "FAIL_CLOSED";
}

function collectFailures(input: GovernanceExplainabilityReplayInput, chain: ReturnType<typeof buildChain>): readonly GovernanceExplainabilityReplayFailure[] {
  const scenario = input.scenario ?? "BASELINE";
  const failures: GovernanceExplainabilityReplayFailure[] = [];
  const direct = failureFor(scenario);
  if (direct) failures.push(direct);
  if (chain.adaptation.contract.supporting_evidence_refs.length === 0 && chain.evidence.validation.supporting_evidence.length === 0) failures.push("GOVERNANCE_EVIDENCE_MISSING");
  if (chain.constitutional.fail_closed) failures.push("CONSTITUTIONAL_IMPLICATIONS_UNKNOWN");
  if (!chain.ledger.replayable || !chain.evidence.replayable || !chain.escalation.replayable) failures.push("REPLAY_CAPABILITY_MISSING");
  if (chain.authority.fail_closed) failures.push("AUTHORITY_IMPACT_UNCLEAR");
  if (!chain.tenant.tenant_isolated || chain.tenant.fail_closed) failures.push("TENANT_BOUNDARY_RISK_EXISTS");
  if (!chain.ledger.audit_ready || !chain.evidence.audit_ready || !chain.escalation.audit_ready) failures.push("AUDITABILITY_WEAKENED");
  if (chain.ledger.lineage_graph.complete === false) failures.push("GOVERNANCE_LINEAGE_INCOMPLETE");
  if (chain.evidence.failures.includes("EVIDENCE_INTEGRITY_VERIFICATION_FAILED")) failures.push("EVIDENCE_INTEGRITY_FAILED");
  if (chain.ledger.fail_closed) failures.push("GOVERNANCE_LEDGER_INTEGRITY_FAILED");
  if (chain.escalation.failures.includes("REPLAY_DIVERGENCE") || chain.evidence.failures.includes("REPLAY_DIVERGENCE")) failures.push("DETERMINISTIC_REPLAY_DIVERGED");
  if (chain.evidence.failures.includes("CERTIFICATION_DEPENDENCIES_INCOMPLETE")) failures.push("CERTIFICATION_DEPENDENCIES_UNRESOLVED");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(chain: ReturnType<typeof buildChain>, failures: readonly GovernanceExplainabilityReplayFailure[]): GovernanceAdaptationValidation {
  const finalState = failures.length > 0 ? "FAIL_CLOSED" : stateFromEscalation(chain.escalation.final_decision);
  const base: Omit<GovernanceAdaptationValidation, "integrity_hash"> = {
    validation_id: `governance_explainability_validation_${hash(chain.adaptation.contract.adaptation_id).slice(0, 16)}`,
    tenant_id: chain.adaptation.contract.tenant_id,
    proposal_id: chain.adaptation.contract.adaptation_id,
    adaptation_type: `${chain.adaptation.contract.recommendation_type}:${chain.adaptation.contract.risk_domain}`,
    governance_status: chain.governance.validation.governance_status,
    constitutional_status: chain.constitutional.validation.constitutional_status,
    authority_status: chain.authority.validation.authority_status,
    tenant_isolation_status: chain.tenant.validation.isolation_status,
    replay_status: failures.includes("DETERMINISTIC_REPLAY_DIVERGED") ? "DIVERGED" : failures.includes("REPLAY_CAPABILITY_MISSING") ? "UNAVAILABLE" : "BYTE_IDENTICAL",
    evidence_status: chain.evidence.validation.evidence_completeness_status,
    certification_status: chain.evidence.validation_state,
    approval_requirements: chain.escalation.decision.approval_requirements,
    violations: freezeArray([...chain.conflict.analysis.detected_conflicts.map((item) => item.conflict_ref), ...failures]),
    restrictions: freezeArray(chain.escalation.decision.restrictions.map((item) => item.restriction_id)),
    required_escalations: freezeArray(chain.escalation.decision.escalation_triggers.map((item) => item.trigger_id)),
    final_validation_state: finalState,
  };
  const validation = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  return failures.includes("INTEGRITY_VERIFICATION_FAILED") ? Object.freeze({ ...validation, integrity_hash: "tampered_governance_explainability_hash" }) : validation;
}

function buildEvidenceAttribution(chain: ReturnType<typeof buildChain>, failures: readonly GovernanceExplainabilityReplayFailure[]): readonly GovernanceEvidenceAttribution[] {
  if (failures.includes("EVIDENCE_ATTRIBUTION_INCOMPLETE")) return freezeArray([]);
  const conclusions = ["governance_decision", "constitutional_reasoning", "authority_validation", "tenant_isolation", "certification_readiness", "escalation_restriction"];
  return freezeArray(conclusions.map((conclusion) => {
    const evidenceRefs = freezeArray([...chain.adaptation.contract.supporting_evidence_refs, ...chain.evidence.validation.supporting_evidence.map((item) => item.evidence_id)]);
    const base: Omit<GovernanceEvidenceAttribution, "integrity_hash"> = {
      attribution_id: `governance_evidence_attribution_${hash(`${chain.adaptation.contract.adaptation_id}:${conclusion}`).slice(0, 14)}`,
      conclusion_ref: conclusion,
      evidence_refs: evidenceRefs,
      lineage_refs: chain.evidence.evidence_lineage_graph.processing_lineage,
      evidence_quality: chain.evidence.validation.evidence_quality_score >= 80 ? "SUFFICIENT" : "INSUFFICIENT",
      sufficient: evidenceRefs.length > 0 && chain.evidence.validation.evidence_quality_score >= 80,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function traceStep(stepName: string, inputValue: unknown, outputValue: unknown, byteIdentical: boolean): GovernanceReplayTraceStep {
  const base: Omit<GovernanceReplayTraceStep, "integrity_hash"> = {
    step_id: `governance_replay_${hash(stepName).slice(0, 14)}`,
    step_name: stepName,
    input_hash: hash(inputValue),
    output_hash: hash(outputValue),
    byte_identical: byteIdentical,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplayTrace(chain: ReturnType<typeof buildChain>, failures: readonly GovernanceExplainabilityReplayFailure[]): readonly GovernanceReplayTraceStep[] {
  const ok = !failures.includes("DETERMINISTIC_REPLAY_DIVERGED") && !failures.includes("REPLAY_METADATA_INCONSISTENT") && !failures.includes("REPLAY_CAPABILITY_MISSING");
  return freezeArray([
    traceStep("validation", chain.adaptation.contract, chain.governance.validation, ok),
    traceStep("policy_evaluation", chain.governance.validation, chain.conflict.analysis, ok),
    traceStep("rule_execution", chain.constitutional.validation, chain.authority.validation, ok),
    traceStep("tenant_isolation", chain.authority.validation, chain.tenant.validation, ok),
    traceStep("evidence_certification", chain.tenant.validation, chain.evidence.validation, ok),
    traceStep("escalation_restriction", chain.evidence.validation, chain.escalation.decision, ok),
  ]);
}

function buildReplayReport(trace: readonly GovernanceReplayTraceStep[], failures: readonly GovernanceExplainabilityReplayFailure[]): GovernanceReplayVerificationReport {
  const byteIdentical = trace.every((step) => step.byte_identical) && failures.length === 0;
  const base: Omit<GovernanceReplayVerificationReport, "integrity_hash"> = {
    report_id: `governance_replay_report_${hash(trace.map((step) => step.integrity_hash)).slice(0, 14)}`,
    replay_status: byteIdentical ? "BYTE_IDENTICAL" : failures.includes("DETERMINISTIC_REPLAY_DIVERGED") ? "DIVERGED" : failures.includes("REPLAY_CAPABILITY_MISSING") ? "UNAVAILABLE" : "DIVERGED",
    validation_sequence_match: byteIdentical,
    policy_evaluation_match: byteIdentical,
    rule_execution_match: byteIdentical,
    violation_match: byteIdentical,
    escalation_match: byteIdentical,
    restriction_match: byteIdentical,
    evidence_attribution_match: byteIdentical && !failures.includes("EVIDENCE_ATTRIBUTION_INCOMPLETE"),
    final_decision_match: byteIdentical,
    integrity_hashes_match: byteIdentical && !failures.includes("INTEGRITY_VERIFICATION_FAILED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedgerEntry(validation: GovernanceAdaptationValidation, report: GovernanceReplayVerificationReport, explanationRefs: readonly string[], replayable: boolean): GovernanceExplainabilityLedgerEntry {
  const base: Omit<GovernanceExplainabilityLedgerEntry, "integrity_hash"> = {
    ledger_entry_id: `governance_explainability_ledger_${hash(validation.validation_id).slice(0, 16)}`,
    tenant_id: validation.tenant_id,
    proposal_id: validation.proposal_id,
    validation_id: validation.validation_id,
    final_validation_state: validation.final_validation_state,
    explanation_refs: explanationRefs,
    replay_report_id: report.report_id,
    validation_timestamp: VALIDATION_TIMESTAMP,
    append_only: true,
    immutable: true,
    replayable,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<GovernanceExplainabilityReplayResult, "integrity_hash" | "replay_hash">): string {
  return hash({ validation: result.validation, narrative: result.governance_decision_narrative, replay_trace: result.governance_replay_trace, replay_report: result.deterministic_replay_verification_report, ledger_entry: result.ledger_entry });
}

function resultIntegrityHash(result: Omit<GovernanceExplainabilityReplayResult, "integrity_hash">): string {
  return hash({
    governance_explainability_replay_version: result.governance_explainability_replay_version,
    api_surface_hash: result.api_surface.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_report_hash: result.deterministic_replay_verification_report.integrity_hash,
    ledger_hash: result.ledger_entry.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function explainGovernanceReplay(input: GovernanceExplainabilityReplayInput = {}): GovernanceExplainabilityReplayResult {
  const api_surface = buildApiSurface();
  const chain = buildChain(input);
  const failures = collectFailures(input, chain);
  const validation = buildValidation(chain, failures);
  const evidence_attribution_graph = buildEvidenceAttribution(chain, failures);
  const trace = buildReplayTrace(chain, failures);
  const replayReport = buildReplayReport(trace, failures);
  const fullyExplainable = failures.length === 0 && evidence_attribution_graph.length > 0 && replayReport.replay_status === "BYTE_IDENTICAL";
  const replayable = replayReport.replay_status === "BYTE_IDENTICAL";
  const explanationRefs = freezeArray([validation.integrity_hash, ...evidence_attribution_graph.map((item) => item.integrity_hash), replayReport.integrity_hash]);
  const ledger_entry = buildLedgerEntry(validation, replayReport, explanationRefs, replayable);
  const base: Omit<GovernanceExplainabilityReplayResult, "integrity_hash" | "replay_hash"> = {
    governance_explainability_replay_version: EXPLAINABILITY_VERSION,
    api_surface,
    validation,
    governance_explainability_report: freezeArray([fullyExplainable ? "FULLY_EXPLAINABLE" : "FAIL_CLOSED", `final_state:${validation.final_validation_state}`]),
    governance_decision_narrative: freezeArray([`Proposal ${validation.proposal_id} resolved to ${validation.final_validation_state}.`, ...validation.violations.map((violation) => `Violation or condition: ${violation}.`)]),
    policy_attribution_report: freezeArray([`policy_status:${chain.conflict.analysis.conflict_status}`, ...chain.conflict.analysis.detected_conflicts.map((item) => item.conflict_ref)]),
    constitutional_reasoning_report: freezeArray([`constitutional_status:${validation.constitutional_status}`, "Constitution-first, advisory-only, replay, audit, and tenant protections evaluated."]),
    authority_validation_explanation: freezeArray([`authority_status:${validation.authority_status}`, "Authority scope, execution authority, governance authority, operator authority, and delegation constraints evaluated."]),
    evidence_attribution_graph,
    restriction_explanation_report: freezeArray(chain.escalation.decision.restrictions.map((item) => `${item.restriction_type}:${item.rationale}:${item.release_condition}`)),
    escalation_explanation_report: freezeArray(chain.escalation.decision.escalation_triggers.map((item) => `${item.category}:${item.rationale}`)),
    governance_replay_trace: trace,
    deterministic_replay_verification_report: replayReport,
    replay_metadata: freezeArray([`replay_status:${replayReport.replay_status}`, `trace_steps:${trace.length}`, `replay_report:${replayReport.report_id}`]),
    failures,
    ledger_entry,
    final_validation_state: validation.final_validation_state,
    fully_explainable: fullyExplainable,
    byte_identical: replayReport.replay_status === "BYTE_IDENTICAL",
    fail_closed: failures.length > 0 || validation.final_validation_state === "FAIL_CLOSED",
    tenant_isolated: !failures.includes("TENANT_BOUNDARY_RISK_EXISTS"),
    audit_ready: !failures.includes("AUDITABILITY_WEAKENED"),
    replayable,
    advisory_only: true,
    immutable: true,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayGovernanceExplainability(result: GovernanceExplainabilityReplayResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getGovernanceExplainabilityReplayFoundation(): GovernanceExplainabilityReplayFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    governance_explainability_replay_version: EXPLAINABILITY_VERSION,
    api_surface,
    result: explainGovernanceReplay(),
  });
}

export const GovernanceExplainabilityReplay = Object.freeze({
  explain: explainGovernanceReplay,
  replay: replayGovernanceExplainability,
});
