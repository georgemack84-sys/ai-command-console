import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { validatePatternIntelligenceContract, replayPatternIntelligenceContract } from "@/services/pattern-intelligence-contract";
import { buildPatternCandidates, replayPatternCandidateBuilder } from "@/services/pattern-candidate-builder";
import { detectPatterns, replayPatternDetection } from "@/services/pattern-detection-engine";
import { validatePatternEvidence, replayPatternEvidenceValidation } from "@/services/pattern-validation-evidence-engine";
import { scorePatternIntelligence, replayPatternScoring } from "@/services/pattern-confidence-strategic-scoring";
import { analyzeGovernanceEscalationPatterns, replayGovernanceEscalationPatterns } from "@/services/governance-escalation-pattern-intelligence";
import { appendPatternIntelligenceLedger, replayPatternIntelligenceLedger } from "@/services/pattern-intelligence-ledger";
import { replayPatternExplainability, verifyPatternReplayExplainability } from "@/services/pattern-replay-explainability";
import { renderOperatorPatternDashboard, replayOperatorPatternDashboard } from "@/services/operator-pattern-intelligence-dashboard";
import type { PatternContractInput } from "@/types/pattern-intelligence-contract";
import type { PatternCandidateInput } from "@/types/pattern-candidate-builder";
import type { PatternDetectionInput } from "@/types/pattern-detection-engine";
import type { PatternValidationInput } from "@/types/pattern-validation-evidence-engine";
import type { PatternScoringInput } from "@/types/pattern-confidence-strategic-scoring";
import type { GovernanceEscalationInput } from "@/types/governance-escalation-pattern-intelligence";
import type { PatternLedgerInput } from "@/types/pattern-intelligence-ledger";
import type { PatternReplayInput } from "@/types/pattern-replay-explainability";
import type { PatternDashboardInput } from "@/types/operator-pattern-intelligence-dashboard";
import type {
  PatternCertificationApiSurface,
  PatternCertificationAreaResult,
  PatternCertificationFailure,
  PatternCertificationFoundation,
  PatternCertificationInput,
  PatternCertificationResult,
  PatternIntelligenceCertificationRecord,
} from "@/types/pattern-intelligence-certification-gate";

const CERTIFICATION_VERSION = "pattern-intelligence-certification-gate/v1" as const;
const CERTIFICATION_TIMESTAMP = "2026-07-09T00:00:00.000Z";

type Scenario = NonNullable<PatternCertificationInput["scenario"]>;

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

function buildApiSurface(): PatternCertificationApiSurface {
  const base: Omit<PatternCertificationApiSurface, "integrity_hash"> = {
    api_id: "pattern_intelligence_certification_gate_api",
    execute_certification: "POST /pattern-intelligence-certification-gate/certify",
    retrieve_status: "POST /pattern-intelligence-certification-gate/status",
    generate_report: "POST /pattern-intelligence-certification-gate/report",
    validate_determinism: "POST /pattern-intelligence-certification-gate/determinism",
    validate_replay: "POST /pattern-intelligence-certification-gate/replay",
    validate_governance: "POST /pattern-intelligence-certification-gate/governance",
    validate_integrity: "POST /pattern-intelligence-certification-gate/integrity",
    validate_tenant_isolation: "POST /pattern-intelligence-certification-gate/tenant",
    verify_production_readiness: "POST /pattern-intelligence-certification-gate/production",
    retrieve_contract: "GET /pattern-intelligence-certification-gate/contract",
    update_supported: false,
    delete_supported: false,
    adaptive_consumption_without_pass_supported: false,
    autonomous_action_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function contractScenario(scenario: Scenario): PatternContractInput["scenario"] {
  const map: Partial<Record<Scenario, PatternContractInput["scenario"]>> = {
    CONTRACT_FAILURE: "PHASE_10_3_NOT_CERTIFIED",
    INSUFFICIENT_EVIDENCE: "MISSING_EVIDENCE",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    HASH_MISMATCH: "HASH_MISMATCH",
    GOVERNANCE_VIOLATION: "GOVERNANCE_FAILURE",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_FAILURE",
    CROSS_TENANT: "CROSS_TENANT",
    FAIL_OPEN: "FAIL_OPEN",
  };
  return map[scenario] ?? "BASELINE";
}

function candidateScenario(scenario: Scenario): PatternCandidateInput["scenario"] {
  const map: Partial<Record<Scenario, PatternCandidateInput["scenario"]>> = {
    CANDIDATE_FAILURE: "INSUFFICIENT_HISTORY",
    INSUFFICIENT_EVIDENCE: "MISSING_EVIDENCE",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    HASH_MISMATCH: "HASH_MISMATCH",
    GOVERNANCE_VIOLATION: "GOVERNANCE_FAILURE",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_FAILURE",
    CROSS_TENANT: "CROSS_TENANT",
    FAIL_OPEN: "FAIL_OPEN",
  };
  return map[scenario] ?? "BASELINE";
}

function detectionScenario(scenario: Scenario): PatternDetectionInput["scenario"] {
  const map: Partial<Record<Scenario, PatternDetectionInput["scenario"]>> = {
    DETECTION_FAILURE: "INVALID_CANDIDATE",
    DETERMINISM_FAILURE: "RANDOMNESS",
    INSUFFICIENT_EVIDENCE: "MISSING_EVIDENCE",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    HASH_MISMATCH: "HASH_MISMATCH",
    GOVERNANCE_VIOLATION: "GOVERNANCE_FAILURE",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_FAILURE",
    CROSS_TENANT: "CROSS_TENANT",
    FAIL_OPEN: "FAIL_OPEN",
  };
  return map[scenario] ?? "BASELINE";
}

function validationScenario(scenario: Scenario): PatternValidationInput["scenario"] {
  const map: Partial<Record<Scenario, PatternValidationInput["scenario"]>> = {
    VALIDATION_FAILURE: "UNSUPPORTED_EVIDENCE",
    INSUFFICIENT_EVIDENCE: "MISSING_EVIDENCE",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    HASH_MISMATCH: "HASH_MISMATCH",
    GOVERNANCE_VIOLATION: "MISSING_GOVERNANCE",
    CROSS_TENANT: "CROSS_TENANT",
  };
  return map[scenario] ?? "BASELINE";
}

function scoringScenario(scenario: Scenario): PatternScoringInput["scenario"] {
  const map: Partial<Record<Scenario, PatternScoringInput["scenario"]>> = {
    SCORING_FAILURE: "NONDETERMINISTIC_WEIGHTING",
    INSUFFICIENT_EVIDENCE: "MISSING_EVIDENCE",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    HASH_MISMATCH: "HASH_MISMATCH",
    GOVERNANCE_VIOLATION: "MISSING_GOVERNANCE",
    CROSS_TENANT: "CROSS_TENANT",
    FAIL_OPEN: "FAIL_OPEN",
  };
  return map[scenario] ?? "BASELINE";
}

function governanceScenario(scenario: Scenario): GovernanceEscalationInput["scenario"] {
  const map: Partial<Record<Scenario, GovernanceEscalationInput["scenario"]>> = {
    GOVERNANCE_FAILURE: "MISSING_GOVERNANCE_LINEAGE",
    GOVERNANCE_VIOLATION: "POLICY_MUTATION",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_RISK",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    HASH_MISMATCH: "HASH_MISMATCH",
    CROSS_TENANT: "CROSS_TENANT",
    ADVISORY_ONLY_VIOLATION: "AUTONOMOUS_GOVERNANCE_ACTION",
    FAIL_OPEN: "FAIL_OPEN",
  };
  return map[scenario] ?? "BASELINE";
}

function ledgerScenario(scenario: Scenario): PatternLedgerInput["scenario"] {
  const map: Partial<Record<Scenario, PatternLedgerInput["scenario"]>> = {
    LEDGER_FAILURE: "HASH_CHAIN_BREAK",
    LEDGER_MUTATION: "RECORD_MUTATION",
    INSUFFICIENT_EVIDENCE: "MISSING_EVIDENCE",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    HASH_MISMATCH: "HASH_MISMATCH",
    CROSS_TENANT: "CROSS_TENANT",
    FAIL_OPEN: "FAIL_OPEN",
  };
  return map[scenario] ?? "BASELINE";
}

function replayScenario(scenario: Scenario): PatternReplayInput["scenario"] {
  const map: Partial<Record<Scenario, PatternReplayInput["scenario"]>> = {
    REPLAY_FAILURE: "REPLAY_DIVERGENCE",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    INCOMPLETE_EXPLAINABILITY: "MISSING_EXPLANATION",
    INSUFFICIENT_EVIDENCE: "MISSING_EVIDENCE",
    HASH_MISMATCH: "HASH_MISMATCH",
    CROSS_TENANT: "CROSS_TENANT",
    ADVISORY_ONLY_VIOLATION: "AUTONOMOUS_LEARNING",
    FAIL_OPEN: "FAIL_OPEN",
  };
  return map[scenario] ?? "BASELINE";
}

function dashboardScenario(scenario: Scenario): PatternDashboardInput["scenario"] {
  const map: Partial<Record<Scenario, PatternDashboardInput["scenario"]>> = {
    DASHBOARD_FAILURE: "HIDDEN_VISUALIZATION",
    MISSING_OPERATOR_VISIBILITY: "HIDDEN_VISUALIZATION",
    INCOMPLETE_EXPLAINABILITY: "MISSING_EXPLANATION",
    INSUFFICIENT_EVIDENCE: "MISSING_EVIDENCE",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    HASH_MISMATCH: "HASH_MISMATCH",
    CROSS_TENANT: "CROSS_TENANT",
    ADVISORY_ONLY_VIOLATION: "AUTONOMOUS_ACTION",
    FAIL_OPEN: "FAIL_OPEN",
  };
  return map[scenario] ?? "BASELINE";
}

function status(ok: boolean): "PASS" | "FAIL" {
  return ok ? "PASS" : "FAIL";
}

function area(id: string, ok: boolean, summary: string, evidenceRefs: readonly string[], replayRefs: readonly string[], failures: readonly PatternCertificationFailure[]): PatternCertificationAreaResult {
  const base: Omit<PatternCertificationAreaResult, "integrity_hash"> = {
    area_id: id,
    status: status(ok),
    summary,
    evidence_refs: freezeArray(evidenceRefs),
    replay_refs: freezeArray(replayRefs),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function uniqueFailures(values: readonly PatternCertificationFailure[]): readonly PatternCertificationFailure[] {
  return freezeArray([...new Set(values)]);
}

export function certifyPatternIntelligence(input: PatternCertificationInput = {}): PatternCertificationResult {
  const scenario = input.scenario ?? "BASELINE";
  const contract_result = validatePatternIntelligenceContract({ scenario: contractScenario(scenario) });
  const candidate_result = buildPatternCandidates({ scenario: candidateScenario(scenario), contract_result });
  const detection_result = detectPatterns({ scenario: detectionScenario(scenario), candidate_result });
  const validation_evidence_result = validatePatternEvidence({ scenario: validationScenario(scenario), detection_result });
  const scoring_result = scorePatternIntelligence({ scenario: scoringScenario(scenario), validation_result: validation_evidence_result });
  const governance_escalation_result = analyzeGovernanceEscalationPatterns({ scenario: governanceScenario(scenario), scoring_result });
  const ledger_result = appendPatternIntelligenceLedger({ scenario: ledgerScenario(scenario), governance_result: governance_escalation_result });
  const replay_explainability_result = replayPatternExplainability({ scenario: replayScenario(scenario), ledger_result });
  const dashboard_result = input.dashboard_result ?? renderOperatorPatternDashboard({ scenario: dashboardScenario(scenario), replay_result: replay_explainability_result });
  const api_surface = buildApiSurface();

  const phaseFailures: PatternCertificationFailure[] = [];
  if (!contract_result.validation.valid) phaseFailures.push("CONTRACT_VALIDATION_FAILED");
  if (!candidate_result.validation.valid) phaseFailures.push("CANDIDATE_GENERATION_FAILED");
  if (!detection_result.validation.valid) phaseFailures.push("DETECTION_FAILED");
  if (!validation_evidence_result.validation.valid) phaseFailures.push("VALIDATION_FAILED");
  if (!scoring_result.validation.certified) phaseFailures.push("SCORING_FAILED");
  if (!governance_escalation_result.validation.certified && scenario !== "CONSTITUTIONAL_VIOLATION") phaseFailures.push("GOVERNANCE_FAILED");
  if (!ledger_result.validation.certified) phaseFailures.push("LEDGER_FAILED");
  if (!replay_explainability_result.validation.certified) phaseFailures.push("REPLAY_FAILED");
  if (!dashboard_result.validation.certified) phaseFailures.push("DASHBOARD_FAILED");

  const deterministicOk = [
    contract_result.deterministic,
    candidate_result.deterministic,
    detection_result.deterministic,
    scoring_result.deterministic,
    governance_escalation_result.deterministic,
    ledger_result.deterministic,
    replay_explainability_result.deterministic,
    dashboard_result.deterministic,
  ].every(Boolean) && scenario !== "DETERMINISM_FAILURE";
  const evidenceOk = validation_evidence_result.validation.evidence_complete && scoring_result.validation.evidence_complete && ledger_result.validation.evidence_references_complete && dashboard_result.validation.evidence_complete;
  const replayOk = replayPatternIntelligenceContract(contract_result)
    && replayPatternCandidateBuilder(candidate_result)
    && replayPatternDetection(detection_result)
    && replayPatternEvidenceValidation(validation_evidence_result)
    && replayPatternScoring(scoring_result)
    && replayGovernanceEscalationPatterns(governance_escalation_result)
    && replayPatternIntelligenceLedger(ledger_result)
    && verifyPatternReplayExplainability(replay_explainability_result)
    && replayOperatorPatternDashboard(dashboard_result)
    && scenario !== "REPLAY_DIVERGENCE";
  const governanceOk = governance_escalation_result.validation.certified && dashboard_result.validation.governance_referenced && scenario !== "GOVERNANCE_VIOLATION";
  const constitutionalOk = [
    contract_result.governance_first,
    detection_result.governance_first,
    governance_escalation_result.constitutionally_compliant,
    ledger_result.constitutionally_compliant,
  ].every(Boolean) && scenario !== "CONSTITUTIONAL_VIOLATION";
  const integrityOk = [
    contract_result.integrity_hash,
    candidate_result.integrity_hash,
    detection_result.integrity_hash,
    validation_evidence_result.integrity_hash,
    scoring_result.integrity_hash,
    governance_escalation_result.integrity_hash,
    ledger_result.integrity_hash,
    replay_explainability_result.integrity_hash,
    dashboard_result.integrity_hash,
  ].every(Boolean) && scenario !== "HASH_MISMATCH";
  const tenantOk = [
    contract_result.validation.tenant_isolated,
    candidate_result.validation.tenant_isolated,
    detection_result.validation.tenant_isolated,
    validation_evidence_result.validation.tenant_isolated,
    scoring_result.validation.tenant_isolated,
    governance_escalation_result.validation.tenant_isolated,
    ledger_result.validation.tenant_isolated,
    replay_explainability_result.validation.tenant_isolated,
    dashboard_result.validation.tenant_isolated,
  ].every(Boolean) && scenario !== "CROSS_TENANT";
  const explainabilityOk = detection_result.validation.explanations_complete
    && scoring_result.validation.explanations_complete
    && governance_escalation_result.validation.explanations_complete
    && ledger_result.validation.explanations_complete
    && replay_explainability_result.validation.explanations_complete
    && dashboard_result.validation.explanations_complete;
  const advisoryOk = [
    contract_result.advisory_only,
    candidate_result.advisory_only,
    detection_result.advisory_only,
    scoring_result.advisory_only,
    governance_escalation_result.advisory_only,
    ledger_result.advisory_only,
    replay_explainability_result.advisory_only,
    dashboard_result.advisory_only,
  ].every(Boolean) && scenario !== "ADVISORY_ONLY_VIOLATION";
  const operatorVisibleOk = dashboard_result.validation.certified && dashboard_result.dashboard_view.visible_pattern_refs.length > 0 && scenario !== "MISSING_OPERATOR_VISIBILITY";
  const ledgerImmutableOk = ledger_result.validation.immutable && ledger_result.validation.append_only && scenario !== "LEDGER_MUTATION";
  const conditionalGap = scenario === "CONDITIONAL_GAP";

  const derivedFailures: PatternCertificationFailure[] = [
    ...phaseFailures,
    ...(deterministicOk ? [] : ["DETERMINISM_FAILED" as const]),
    ...(evidenceOk ? [] : ["EVIDENCE_INSUFFICIENT" as const]),
    ...(replayOk ? [] : ["REPLAY_DIVERGENCE" as const]),
    ...(governanceOk ? [] : ["GOVERNANCE_VIOLATION" as const]),
    ...(constitutionalOk ? [] : ["CONSTITUTIONAL_VIOLATION" as const]),
    ...(integrityOk ? [] : ["INTEGRITY_FAILURE" as const]),
    ...(tenantOk ? [] : ["TENANT_ISOLATION_BREACH" as const]),
    ...(advisoryOk ? [] : ["ADVISORY_ONLY_VIOLATION" as const]),
    ...(ledgerImmutableOk ? [] : ["LEDGER_MUTATION" as const]),
    ...(explainabilityOk ? [] : ["EXPLAINABILITY_INCOMPLETE" as const]),
    ...(operatorVisibleOk ? [] : ["OPERATOR_VISIBILITY_MISSING" as const]),
    ...(conditionalGap ? ["CONDITIONAL_GAP_REMAINING" as const] : []),
    ...(scenario === "FAIL_OPEN" ? ["FAIL_OPEN_BEHAVIOR" as const] : []),
  ];
  const failed_tests = uniqueFailures(derivedFailures);
  const certification_state = failed_tests.length === 0 ? "PASS" : conditionalGap && failed_tests.every((failure) => failure === "CONDITIONAL_GAP_REMAINING") ? "CONDITIONAL_PASS" : "FAIL";
  const productionReady = certification_state === "PASS";
  const productionFailures = productionReady ? freezeArray<PatternCertificationFailure>([]) : freezeArray<PatternCertificationFailure>(["PRODUCTION_READINESS_BLOCKED", ...failed_tests]);

  const allEvidenceRefs = freezeArray(dashboard_result.dashboard_view.visible_evidence_refs);
  const allReplayRefs = freezeArray(dashboard_result.dashboard_view.visible_replay_refs);
  const determinism_report = area("determinism_validation_report", deterministicOk, "Identical Pattern Intelligence inputs produce stable identities, scores, replay outputs, and dashboard views.", allEvidenceRefs, allReplayRefs, deterministicOk ? [] : ["DETERMINISM_FAILED"]);
  const replay_report = area("replay_validation_report", replayOk, "Replay reconstructs the full Pattern Intelligence pipeline.", allEvidenceRefs, allReplayRefs, replayOk ? [] : ["REPLAY_DIVERGENCE"]);
  const governance_report = area("governance_compliance_report", governanceOk, "Governance findings, escalation lineage, and operator-visible governance context are preserved.", allEvidenceRefs, allReplayRefs, governanceOk ? [] : ["GOVERNANCE_VIOLATION"]);
  const constitutional_report = area("constitutional_compliance_report", constitutionalOk && advisoryOk, "Constitutional advisory-only, operator supremacy, replay, explainability, and tenant isolation rules are enforced.", allEvidenceRefs, allReplayRefs, constitutionalOk && advisoryOk ? [] : ["CONSTITUTIONAL_VIOLATION", ...(advisoryOk ? [] : ["ADVISORY_ONLY_VIOLATION" as const])]);
  const integrity_report = area("integrity_verification_report", integrityOk && ledgerImmutableOk, "Integrity hashes, ledger immutability, lineage, and hash-chain behavior are verified.", allEvidenceRefs, allReplayRefs, integrityOk && ledgerImmutableOk ? [] : ["INTEGRITY_FAILURE", ...(ledgerImmutableOk ? [] : ["LEDGER_MUTATION" as const])]);
  const tenant_isolation_report = area("tenant_isolation_report", tenantOk, "Tenant-specific pattern generation, replay, ledgers, and dashboards remain isolated.", allEvidenceRefs, allReplayRefs, tenantOk ? [] : ["TENANT_ISOLATION_BREACH"]);
  const explainability_report = area("explainability_certification_report", explainabilityOk && operatorVisibleOk, "Every certified pattern includes evidence, scoring, governance, replay, and operator-facing explanations.", allEvidenceRefs, allReplayRefs, explainabilityOk && operatorVisibleOk ? [] : ["EXPLAINABILITY_INCOMPLETE", ...(operatorVisibleOk ? [] : ["OPERATOR_VISIBILITY_MISSING" as const])]);
  const production_readiness_report = area("production_readiness_assessment", productionReady, productionReady ? "Pattern Intelligence is fully certified for downstream Adaptive Intelligence consumption." : "Pattern Intelligence is blocked from downstream Adaptive Intelligence consumption until a full PASS is achieved.", allEvidenceRefs, allReplayRefs, productionFailures);

  const recordBase: Omit<PatternIntelligenceCertificationRecord, "integrity_hash"> = {
    certification_id: `pattern_intelligence_certification_${hash(`${dashboard_result.integrity_hash}:${certification_state}`).slice(0, 16)}`,
    phase_id: "10.4",
    certification_timestamp: CERTIFICATION_TIMESTAMP,
    certification_version: CERTIFICATION_VERSION,
    contract_validation_result: status(contract_result.validation.valid),
    candidate_generation_result: status(candidate_result.validation.valid),
    detection_result: status(detection_result.validation.valid),
    validation_result: status(validation_evidence_result.validation.valid),
    scoring_result: status(scoring_result.validation.certified),
    governance_result: status(governanceOk),
    ledger_result: status(ledger_result.validation.certified && ledgerImmutableOk),
    replay_result: status(replay_explainability_result.validation.certified && replayOk),
    dashboard_result: status(dashboard_result.validation.certified && operatorVisibleOk),
    constitutional_result: status(constitutionalOk && advisoryOk),
    governance_compliance_result: status(governanceOk),
    tenant_isolation_result: status(tenantOk),
    production_readiness_result: status(productionReady),
    certification_state,
    failed_tests,
    certification_summary: productionReady ? "Phase 10.4 Pattern Intelligence certification passed." : `Phase 10.4 Pattern Intelligence certification blocked: ${failed_tests.join(", ")}`,
    replay_refs: allReplayRefs,
    adaptive_consumption_allowed: productionReady,
    advisory_only: true,
    immutable: true,
  };
  const certification_record = Object.freeze({ ...recordBase, integrity_hash: hashWithoutIntegrity(recordBase) });

  const base: Omit<PatternCertificationResult, "integrity_hash" | "replay_hash"> = {
    pattern_intelligence_certification_gate_version: CERTIFICATION_VERSION,
    contract_result,
    candidate_result,
    detection_result,
    validation_evidence_result,
    scoring_result,
    governance_escalation_result,
    ledger_result,
    replay_explainability_result,
    dashboard_result,
    api_surface,
    certification_record,
    determinism_report,
    replay_report,
    governance_report,
    constitutional_report,
    integrity_report,
    tenant_isolation_report,
    explainability_report,
    production_readiness_report,
    deterministic: true,
    replayable: true,
    evidence_based: evidenceOk,
    governance_compliant: governanceOk,
    constitutionally_compliant: constitutionalOk && advisoryOk,
    tenant_isolated: tenantOk,
    advisory_only: true,
    fail_closed: true,
    adaptive_consumption_allowed: productionReady,
    autonomous_learning: false,
    autonomous_execution: false,
  };
  const replay_hash = hash({
    dashboard_replay_hash: dashboard_result.replay_hash,
    certification_record,
    reports: [determinism_report, replay_report, governance_report, constitutional_report, integrity_report, tenant_isolation_report, explainability_report, production_readiness_report],
  });
  const integrity_hash = hash({
    certification_hash: certification_record.integrity_hash,
    api_surface_hash: api_surface.integrity_hash,
    replay_hash,
    adaptive_consumption_allowed: productionReady,
    certification_state,
  });
  return Object.freeze({ ...base, replay_hash, integrity_hash });
}

export function replayPatternIntelligenceCertification(result: PatternCertificationResult): boolean {
  const replay_hash = hash({
    dashboard_replay_hash: result.dashboard_result.replay_hash,
    certification_record: result.certification_record,
    reports: [result.determinism_report, result.replay_report, result.governance_report, result.constitutional_report, result.integrity_report, result.tenant_isolation_report, result.explainability_report, result.production_readiness_report],
  });
  const integrity_hash = hash({
    certification_hash: result.certification_record.integrity_hash,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash,
    adaptive_consumption_allowed: result.adaptive_consumption_allowed,
    certification_state: result.certification_record.certification_state,
  });
  return replay_hash === result.replay_hash && integrity_hash === result.integrity_hash && replayOperatorPatternDashboard(result.dashboard_result);
}

export function getPatternIntelligenceCertificationFoundation(): PatternCertificationFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    pattern_intelligence_certification_gate_version: CERTIFICATION_VERSION,
    api_surface,
    result: certifyPatternIntelligence(),
  });
}

export const PatternIntelligenceCertificationGate = Object.freeze({
  certify: certifyPatternIntelligence,
  replay: replayPatternIntelligenceCertification,
});
