import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildGovernanceAssurancePackage, computeGovernanceAssuranceEvidenceHash } from "@/services/governance-assurance-engine";
import { buildRuntimeAssurancePackage, computeRuntimeAssuranceEvidenceHash } from "@/services/runtime-assurance-engine";
import type { GovernanceAssurancePackage, GovernanceAssuranceScenario } from "@/types/governance-assurance-engine";
import type { RuntimeAssurancePackage, RuntimeAssuranceScenario } from "@/types/runtime-assurance-engine";
import type {
  InterventionPriority,
  InterventionPriorityAssessment,
  RecoveryConfidenceAssessment,
  RecoveryConfidenceLevel,
  RecoveryExplainability,
  RecoveryInterventionDashboardSurface,
  RecoveryInterventionFailureReason,
  RecoveryInterventionFramework,
  RecoveryInterventionPackage,
  RecoveryInterventionReplayResult,
  RecoveryInterventionScenario,
  RecoveryInterventionState,
  RecoveryInterventionValidationResult,
  RecoveryOptionAssessment,
  RecoveryRecommendation,
  RecoveryRecommendedAction,
  RollbackConfidenceLevel,
} from "@/types/recovery-intervention-intelligence";

const NOW = "2026-06-29T21:00:00.000Z";
const ENGINE_VERSION = "recovery-intervention-intelligence/v8E.4" as const;
const PIPELINE: readonly RecoveryInterventionState[] = Object.freeze(["INITIALIZING", "COLLECTING_EVIDENCE", "ANALYZING_FAILURE", "EVALUATING_OPTIONS", "ESTIMATING_CONFIDENCE", "PRIORITIZING_INTERVENTION", "GENERATING_RECOMMENDATION", "AWAITING_GOVERNANCE"]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function runtimeScenarioFor(scenario: RecoveryInterventionScenario): RuntimeAssuranceScenario {
  if (scenario === "DEPENDENCY_UNAVAILABLE") return "UNRESOLVED_DEPENDENCY";
  if (scenario === "CHECKPOINT_CORRUPTED") return "CHECKPOINT_CORRUPTION";
  if (scenario === "CONSTITUTIONAL_VIOLATION") return "CONSTITUTIONAL_VIOLATION";
  if (scenario === "GOVERNANCE_CONFLICT") return "POLICY_VIOLATION";
  if (scenario === "AUTHORITY_AMBIGUITY") return "AUTHORITY_VIOLATION";
  if (scenario === "EXECUTION_DEADLOCK") return "STALLED_EXECUTION";
  if (scenario === "REPLAY_IMPOSSIBLE") return "REPLAY_MISMATCH";
  if (scenario === "INSUFFICIENT_EVIDENCE") return "EVIDENCE_INCOMPLETE";
  if (scenario === "UNRECOVERABLE_CORRUPTION" || scenario === "HASH_MISMATCH") return "HASH_MISMATCH";
  return "BASELINE";
}

function governanceScenarioFor(scenario: RecoveryInterventionScenario): GovernanceAssuranceScenario {
  if (scenario === "MISSING_APPROVAL") return "MISSING_APPROVAL";
  if (scenario === "CONSTITUTIONAL_VIOLATION") return "CONSTITUTIONAL_VIOLATION";
  if (scenario === "GOVERNANCE_CONFLICT") return "POLICY_CONFLICT";
  if (scenario === "AUTHORITY_AMBIGUITY") return "INVALID_EXECUTION_AUTHORITY";
  if (scenario === "INSUFFICIENT_EVIDENCE") return "INCOMPLETE_EVIDENCE";
  if (scenario === "UNRECOVERABLE_CORRUPTION" || scenario === "HASH_MISMATCH") return "HASH_MISMATCH";
  return "BASELINE";
}

function scenarioFailures(scenario: RecoveryInterventionScenario): readonly RecoveryInterventionFailureReason[] {
  const map: Partial<Record<RecoveryInterventionScenario, RecoveryInterventionFailureReason>> = {
    TRANSIENT_FAILURE: "TRANSIENT_FAILURE_DETECTED",
    MISSING_APPROVAL: "APPROVAL_PENDING",
    DEPENDENCY_UNAVAILABLE: "DEPENDENCY_UNAVAILABLE",
    CHECKPOINT_AVAILABLE: "CHECKPOINT_AVAILABLE",
    CHECKPOINT_CORRUPTED: "CHECKPOINT_CORRUPTED",
    ALTERNATE_PLAN_AVAILABLE: "ALTERNATE_PLAN_AVAILABLE",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION",
    GOVERNANCE_CONFLICT: "GOVERNANCE_CONFLICT",
    AUTHORITY_AMBIGUITY: "AUTHORITY_AMBIGUITY",
    EXECUTION_DEADLOCK: "EXECUTION_DEADLOCK",
    CONFIDENCE_COLLAPSE: "CONFIDENCE_COLLAPSE",
    UNRECOVERABLE_CORRUPTION: "UNRECOVERABLE_CORRUPTION",
    REPLAY_IMPOSSIBLE: "REPLAY_IMPOSSIBLE",
    INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
    HASH_MISMATCH: "INTEGRITY_HASH_MISMATCH",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function collectFailures(runtimePackage: RuntimeAssurancePackage, governancePackage: GovernanceAssurancePackage, scenario: RecoveryInterventionScenario): readonly RecoveryInterventionFailureReason[] {
  const failures: RecoveryInterventionFailureReason[] = [...scenarioFailures(scenario)];
  if (runtimePackage.validation.validation_state === "FAIL") failures.push("RUNTIME_ASSURANCE_FAILED");
  if (governancePackage.validation.validation_state === "FAIL") failures.push("GOVERNANCE_ASSURANCE_FAILED");
  if (!runtimePackage.validation.tenant_isolated || !governancePackage.validation.tenant_isolated) failures.push("TENANT_ISOLATION_VIOLATION");
  if (!runtimePackage.validation.advisory_only || !governancePackage.validation.advisory_only) failures.push("ASSURANCE_NOT_ADVISORY");
  if (!runtimePackage.validation.evidence_complete || !governancePackage.validation.evidence_complete) failures.push("INSUFFICIENT_EVIDENCE");
  if (!runtimePackage.validation.integrity_verified || !governancePackage.validation.integrity_verified) failures.push("INTEGRITY_HASH_MISMATCH");
  if (computeRuntimeAssuranceEvidenceHash(runtimePackage.assurance_evidence) !== runtimePackage.assurance_evidence.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (computeGovernanceAssuranceEvidenceHash(governancePackage.assurance_evidence) !== governancePackage.assurance_evidence.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  return unique(failures);
}

function has(failures: readonly RecoveryInterventionFailureReason[], values: readonly RecoveryInterventionFailureReason[]): boolean {
  return failures.some((failure) => values.includes(failure));
}

function option(action: RecoveryRecommendedAction, failures: readonly RecoveryInterventionFailureReason[], packageId: string): RecoveryOptionAssessment {
  const terminalBlockers: readonly RecoveryInterventionFailureReason[] = ["CONSTITUTIONAL_VIOLATION", "AUTHORITY_AMBIGUITY", "GOVERNANCE_CONFLICT", "UNRECOVERABLE_CORRUPTION", "REPLAY_IMPOSSIBLE", "INTEGRITY_HASH_MISMATCH", "TENANT_ISOLATION_VIOLATION", "ASSURANCE_NOT_ADVISORY"];
  const rejection: RecoveryInterventionFailureReason[] = [];
  let eligible = false;
  let confidence_score = 40;
  let expected_outcome = "Operator review preserves evidence and prevents autonomous changes.";
  if (action === "CONTINUE") {
    eligible = failures.length === 0;
    confidence_score = eligible ? 98 : 20;
    if (!eligible) rejection.push(...failures);
    expected_outcome = "Execution continues unchanged under existing assurance monitoring.";
  }
  if (action === "RETRY") {
    eligible = failures.includes("TRANSIENT_FAILURE_DETECTED") && !has(failures, terminalBlockers);
    confidence_score = eligible ? 78 : 25;
    if (!eligible) rejection.push(...(has(failures, terminalBlockers) ? terminalBlockers.filter((failure) => failures.includes(failure)) : ["INSUFFICIENT_EVIDENCE"] as const));
    expected_outcome = "Failed activity is retried within retry limits while preserving replay metadata.";
  }
  if (action === "PAUSE") {
    eligible = has(failures, ["APPROVAL_PENDING", "DEPENDENCY_UNAVAILABLE", "INSUFFICIENT_EVIDENCE", "GOVERNANCE_ASSURANCE_FAILED"]);
    confidence_score = eligible ? 82 : 45;
    if (!eligible) rejection.push("INSUFFICIENT_EVIDENCE");
    expected_outcome = "Execution pauses while approvals, evidence, or dependencies are resolved.";
  }
  if (action === "ROLLBACK") {
    eligible = failures.includes("CHECKPOINT_AVAILABLE") && !has(failures, ["CHECKPOINT_CORRUPTED", "REPLAY_IMPOSSIBLE", "INTEGRITY_HASH_MISMATCH", "INSUFFICIENT_EVIDENCE"]);
    confidence_score = eligible ? 88 : failures.includes("CHECKPOINT_CORRUPTED") ? 10 : 35;
    if (!eligible) rejection.push(...(failures.includes("CHECKPOINT_CORRUPTED") ? ["CHECKPOINT_CORRUPTED"] as const : ["INSUFFICIENT_EVIDENCE"] as const));
    expected_outcome = "Execution returns to the last verified checkpoint with replay-compatible evidence.";
  }
  if (action === "ALTERNATE_PLAN") {
    eligible = failures.includes("ALTERNATE_PLAN_AVAILABLE") && !has(failures, terminalBlockers);
    confidence_score = eligible ? 80 : 30;
    if (!eligible) rejection.push(...(has(failures, terminalBlockers) ? terminalBlockers.filter((failure) => failures.includes(failure)) : ["INSUFFICIENT_EVIDENCE"] as const));
    expected_outcome = "Approved alternate strategy is recommended for operator-governed selection.";
  }
  if (action === "ESCALATE") {
    eligible = failures.length > 0 && !has(failures, ["UNRECOVERABLE_CORRUPTION", "REPLAY_IMPOSSIBLE", "INTEGRITY_HASH_MISMATCH"]);
    confidence_score = eligible ? 92 : 55;
    expected_outcome = "Operator receives a prioritized intervention package with evidence summary.";
  }
  if (action === "TERMINATE") {
    eligible = has(failures, ["CONSTITUTIONAL_VIOLATION", "AUTHORITY_AMBIGUITY", "UNRECOVERABLE_CORRUPTION", "REPLAY_IMPOSSIBLE", "INTEGRITY_HASH_MISMATCH", "TENANT_ISOLATION_VIOLATION", "ASSURANCE_NOT_ADVISORY"]);
    confidence_score = eligible ? 95 : 20;
    if (!eligible) rejection.push("INSUFFICIENT_EVIDENCE");
    expected_outcome = "Execution terminates safely after preserving evidence for audit and replay.";
  }
  const required_approvals = action === "CONTINUE" ? freezeArray<string>([]) : freezeArray(["operator:mission-control", "governance:assurance"]);
  const source = { option_id: id("RIIO", "recovery-intervention-option-id", { packageId, action }), action, eligible, confidence_score, rejection_reasons: unique(rejection), required_approvals, expected_outcome };
  return Object.freeze({ ...source, assessment_hash: hashValue("recovery-intervention-option", source) });
}

function buildOptions(packageId: string, failures: readonly RecoveryInterventionFailureReason[]): readonly RecoveryOptionAssessment[] {
  return freezeArray((["CONTINUE", "RETRY", "PAUSE", "ROLLBACK", "ALTERNATE_PLAN", "ESCALATE", "TERMINATE"] as const).map((action) => option(action, failures, packageId)));
}

function confidenceLevel(score: number): RecoveryConfidenceLevel {
  if (score >= 90) return "VERY_HIGH";
  if (score >= 75) return "HIGH";
  if (score >= 55) return "MEDIUM";
  if (score >= 30) return "LOW";
  return "INSUFFICIENT";
}

function rollbackLevel(score: number): RollbackConfidenceLevel {
  if (score >= 90) return "CERTAIN";
  if (score >= 75) return "HIGH";
  if (score >= 55) return "MODERATE";
  if (score >= 30) return "LOW";
  return "UNSAFE";
}

function buildConfidence(packageId: string, options: readonly RecoveryOptionAssessment[], failures: readonly RecoveryInterventionFailureReason[]): RecoveryConfidenceAssessment {
  const best = Math.max(...options.filter((item) => item.eligible).map((item) => item.confidence_score), failures.length ? 35 : 98);
  const rollback = options.find((item) => item.action === "ROLLBACK")?.confidence_score ?? 0;
  const source = {
    assessment_id: id("RIIC", "recovery-intervention-confidence-id", packageId),
    recovery_score: has(failures, ["INSUFFICIENT_EVIDENCE", "INTEGRITY_HASH_MISMATCH"]) ? Math.min(best, 25) : best,
    recovery_confidence: confidenceLevel(has(failures, ["INSUFFICIENT_EVIDENCE", "INTEGRITY_HASH_MISMATCH"]) ? Math.min(best, 25) : best),
    rollback_score: rollback,
    rollback_confidence: rollbackLevel(rollback),
    confidence_factors: freezeArray([
      failures.length ? "active deviations present" : "no active deviations",
      failures.includes("CHECKPOINT_AVAILABLE") ? "verified checkpoint available" : "checkpoint not selected",
      failures.includes("INSUFFICIENT_EVIDENCE") ? "evidence incomplete" : "evidence complete",
      failures.includes("REPLAY_IMPOSSIBLE") ? "replay impossible" : "replay preserved",
    ]),
  };
  return Object.freeze({ ...source, assessment_hash: hashValue("recovery-intervention-confidence", source) });
}

function priorityFor(failures: readonly RecoveryInterventionFailureReason[]): InterventionPriority {
  if (has(failures, ["CONSTITUTIONAL_VIOLATION", "UNRECOVERABLE_CORRUPTION", "REPLAY_IMPOSSIBLE", "INTEGRITY_HASH_MISMATCH", "TENANT_ISOLATION_VIOLATION"])) return "P1_CRITICAL";
  if (has(failures, ["GOVERNANCE_CONFLICT", "AUTHORITY_AMBIGUITY", "CONFIDENCE_COLLAPSE", "ASSURANCE_NOT_ADVISORY"])) return "P2_HIGH";
  if (has(failures, ["EXECUTION_DEADLOCK", "CHECKPOINT_CORRUPTED", "GOVERNANCE_ASSURANCE_FAILED", "RUNTIME_ASSURANCE_FAILED"])) return "P3_MEDIUM";
  if (has(failures, ["APPROVAL_PENDING", "DEPENDENCY_UNAVAILABLE", "TRANSIENT_FAILURE_DETECTED"])) return "P4_LOW";
  return "P5_INFORMATIONAL";
}

function buildPriority(packageId: string, failures: readonly RecoveryInterventionFailureReason[]): InterventionPriorityAssessment {
  const priority = priorityFor(failures);
  const source = {
    priority_id: id("RIIP", "recovery-intervention-priority-id", packageId),
    intervention_priority: priority,
    priority_score: priority === "P1_CRITICAL" ? 100 : priority === "P2_HIGH" ? 82 : priority === "P3_MEDIUM" ? 62 : priority === "P4_LOW" ? 35 : 10,
    urgency_reason: priority === "P5_INFORMATIONAL" ? "No intervention required." : "Deviation requires governed operator-visible intervention.",
    priority_factors: failures,
  };
  return Object.freeze({ ...source, priority_hash: hashValue("recovery-intervention-priority", source) });
}

function selectAction(options: readonly RecoveryOptionAssessment[], failures: readonly RecoveryInterventionFailureReason[]): RecoveryOptionAssessment {
  const order: readonly RecoveryRecommendedAction[] = has(failures, ["CONSTITUTIONAL_VIOLATION", "AUTHORITY_AMBIGUITY", "UNRECOVERABLE_CORRUPTION", "REPLAY_IMPOSSIBLE", "INTEGRITY_HASH_MISMATCH", "TENANT_ISOLATION_VIOLATION", "ASSURANCE_NOT_ADVISORY"])
    ? ["TERMINATE", "ESCALATE", "PAUSE", "ROLLBACK", "ALTERNATE_PLAN", "RETRY", "CONTINUE"]
    : failures.includes("CHECKPOINT_AVAILABLE")
      ? ["ROLLBACK", "ESCALATE", "PAUSE", "ALTERNATE_PLAN", "RETRY", "CONTINUE", "TERMINATE"]
      : failures.includes("ALTERNATE_PLAN_AVAILABLE")
        ? ["ALTERNATE_PLAN", "ESCALATE", "PAUSE", "RETRY", "ROLLBACK", "CONTINUE", "TERMINATE"]
        : failures.includes("TRANSIENT_FAILURE_DETECTED")
          ? ["RETRY", "PAUSE", "ESCALATE", "ALTERNATE_PLAN", "ROLLBACK", "CONTINUE", "TERMINATE"]
          : has(failures, ["APPROVAL_PENDING", "DEPENDENCY_UNAVAILABLE", "INSUFFICIENT_EVIDENCE"])
            ? ["PAUSE", "ESCALATE", "RETRY", "ALTERNATE_PLAN", "ROLLBACK", "CONTINUE", "TERMINATE"]
            : failures.length
              ? ["ESCALATE", "PAUSE", "ROLLBACK", "ALTERNATE_PLAN", "RETRY", "CONTINUE", "TERMINATE"]
              : ["CONTINUE", "RETRY", "PAUSE", "ROLLBACK", "ALTERNATE_PLAN", "ESCALATE", "TERMINATE"];
  for (const action of order) {
    const candidate = options.find((item) => item.action === action && item.eligible);
    if (candidate) return candidate;
  }
  return options.find((item) => item.action === "ESCALATE") ?? options[0];
}

function recommendationHashSource(recommendation: Omit<RecoveryRecommendation, "integrity_hash"> | RecoveryRecommendation) {
  return {
    recommendation_id: recommendation.recommendation_id,
    tenant_id: recommendation.tenant_id,
    mission_id: recommendation.mission_id,
    execution_id: recommendation.execution_id,
    runtime_state: recommendation.runtime_state,
    governance_state: recommendation.governance_state,
    recommended_action: recommendation.recommended_action,
    recommendation_reason: recommendation.recommendation_reason,
    recovery_confidence: recommendation.recovery_confidence,
    rollback_confidence: recommendation.rollback_confidence,
    intervention_priority: recommendation.intervention_priority,
    alternative_options: recommendation.alternative_options.map((item) => item.assessment_hash),
    expected_outcome: recommendation.expected_outcome,
    operator_required: recommendation.operator_required,
    required_approvals: recommendation.required_approvals,
    risk_assessment: recommendation.risk_assessment,
    evidence_summary: recommendation.evidence_summary,
    lineage_reference: recommendation.lineage_reference,
    replay_reference: recommendation.replay_reference,
    evidence_reference: recommendation.evidence_reference,
    created_at: recommendation.created_at,
  };
}

export function computeRecoveryRecommendationHash(recommendation: Omit<RecoveryRecommendation, "integrity_hash"> | RecoveryRecommendation): string {
  return hashValue("recovery-intervention-recommendation", recommendationHashSource(recommendation));
}

function buildRecommendation(packageId: string, runtimePackage: RuntimeAssurancePackage, governancePackage: GovernanceAssurancePackage, options: readonly RecoveryOptionAssessment[], confidence: RecoveryConfidenceAssessment, priority: InterventionPriorityAssessment, failures: readonly RecoveryInterventionFailureReason[], scenario: RecoveryInterventionScenario): RecoveryRecommendation {
  const selected = selectAction(options, failures);
  const source = {
    recommendation_id: id("RIIR", "recovery-intervention-recommendation-id", packageId),
    tenant_id: runtimePackage.source_assurance_record.tenant_id,
    mission_id: runtimePackage.source_assurance_record.mission_id,
    execution_id: runtimePackage.assurance_evidence.execution_id,
    runtime_state: runtimePackage.pipeline_state,
    governance_state: governancePackage.pipeline_state,
    recommended_action: selected.action,
    recommendation_reason: selected.eligible ? selected.expected_outcome : "No safe autonomous path exists; preserve evidence and escalate.",
    recovery_confidence: confidence.recovery_confidence,
    rollback_confidence: confidence.rollback_confidence,
    intervention_priority: priority.intervention_priority,
    alternative_options: options,
    expected_outcome: selected.expected_outcome,
    operator_required: selected.action !== "CONTINUE",
    required_approvals: selected.required_approvals,
    risk_assessment: priority.intervention_priority === "P1_CRITICAL" ? "CRITICAL" as const : priority.intervention_priority === "P2_HIGH" ? "HIGH" as const : priority.intervention_priority === "P3_MEDIUM" ? "MEDIUM" as const : "LOW" as const,
    evidence_summary: freezeArray([runtimePackage.assurance_evidence.integrity_hash, governancePackage.assurance_evidence.integrity_hash, ...failures]),
    lineage_reference: scenario === "INSUFFICIENT_EVIDENCE" ? "" : runtimePackage.assurance_evidence.lineage_reference,
    replay_reference: scenario === "INSUFFICIENT_EVIDENCE" ? "" : runtimePackage.assurance_evidence.replay_reference,
    evidence_reference: scenario === "INSUFFICIENT_EVIDENCE" ? "" : runtimePackage.assurance_evidence.evidence_reference,
    created_at: NOW,
  };
  return Object.freeze({ ...source, integrity_hash: scenario === "HASH_MISMATCH" ? "tampered-recovery-recommendation" : computeRecoveryRecommendationHash(source) });
}

function buildExplainability(packageId: string, recommendation: RecoveryRecommendation, runtimePackage: RuntimeAssurancePackage, governancePackage: GovernanceAssurancePackage): RecoveryExplainability {
  const source = {
    explainability_id: id("RIIX", "recovery-intervention-explainability-id", packageId),
    selected_reason: recommendation.recommendation_reason,
    rejected_options: freezeArray(recommendation.alternative_options.filter((item) => item.action !== recommendation.recommended_action && !item.eligible).map((item) => `${item.action}: ${item.rejection_reasons.join(",") || "not preferred"}`)),
    runtime_conditions: freezeArray([runtimePackage.health_report.overall_runtime_health, runtimePackage.execution_validation_report.validation_outcome, ...runtimePackage.validation.failures]),
    governance_rules: freezeArray([governancePackage.governance_report.constitution_status, governancePackage.governance_report.authority_status, governancePackage.governance_report.policy_status, ...governancePackage.validation.failures]),
    constitutional_principles: freezeArray(["constitution overrides optimization", "governance overrides autonomy", "operator supremacy preserved"]),
    authority_validations: freezeArray([governancePackage.authority_validation.certification_status, governancePackage.authority_validation.expiration_analysis, ...governancePackage.authority_validation.approval_chain]),
    supporting_evidence: recommendation.evidence_summary,
    expected_consequences: freezeArray([recommendation.expected_outcome, recommendation.operator_required ? "operator approval required before execution changes" : "no operator action required"]),
  };
  return Object.freeze({ ...source, explainability_hash: hashValue("recovery-intervention-explainability", source) });
}

function validatePackage(pkgBase: Omit<RecoveryInterventionPackage, "validation" | "replay" | "package_hash">): RecoveryInterventionValidationResult {
  const failures: RecoveryInterventionFailureReason[] = [];
  if (pkgBase.source_runtime_package.validation.validation_state === "FAIL") failures.push("RUNTIME_ASSURANCE_FAILED");
  if (pkgBase.source_governance_package.validation.validation_state === "FAIL") failures.push("GOVERNANCE_ASSURANCE_FAILED");
  if (!pkgBase.source_runtime_package.validation.tenant_isolated || !pkgBase.source_governance_package.validation.tenant_isolated) failures.push("TENANT_ISOLATION_VIOLATION");
  if (!pkgBase.recommendation.lineage_reference || !pkgBase.recommendation.replay_reference || !pkgBase.recommendation.evidence_reference) failures.push("INSUFFICIENT_EVIDENCE");
  if (!pkgBase.advisory_only || pkgBase.recovery_executed || pkgBase.workflow_modified || pkgBase.approval_granted || pkgBase.authority_modified || pkgBase.governance_bypassed) failures.push("ASSURANCE_NOT_ADVISORY");
  if (computeRecoveryRecommendationHash(pkgBase.recommendation) !== pkgBase.recommendation.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  const uniqueFailures = unique([...failures, ...pkgBase.recommendation.evidence_summary.filter((item): item is RecoveryInterventionFailureReason => item === "INTEGRITY_HASH_MISMATCH" || item === "ASSURANCE_NOT_ADVISORY" || item === "TENANT_ISOLATION_VIOLATION" || item === "INSUFFICIENT_EVIDENCE")]);
  const validation_state = uniqueFailures.length ? "FAIL" as const : "PASS" as const;
  const source = { package_id: pkgBase.package_id, validation_state, failures: uniqueFailures };
  return Object.freeze({
    validation_id: id("RIIVAL", "recovery-intervention-validation-id", source),
    package_id: pkgBase.package_id,
    validation_state,
    failures: uniqueFailures,
    runtime_evidence_valid: !uniqueFailures.includes("RUNTIME_ASSURANCE_FAILED"),
    governance_evidence_valid: !uniqueFailures.includes("GOVERNANCE_ASSURANCE_FAILED"),
    recommendation_deterministic: pkgBase.recommendation.alternative_options.length === 7,
    operator_supremacy_preserved: !pkgBase.approval_granted,
    advisory_only: !uniqueFailures.includes("ASSURANCE_NOT_ADVISORY"),
    tenant_isolated: !uniqueFailures.includes("TENANT_ISOLATION_VIOLATION"),
    evidence_complete: !uniqueFailures.includes("INSUFFICIENT_EVIDENCE"),
    integrity_verified: !uniqueFailures.includes("INTEGRITY_HASH_MISMATCH"),
    ready_for_certification: validation_state === "PASS",
    validation_hash: hashValue("recovery-intervention-validation", source),
  });
}

function replayPackage(pkgBase: Omit<RecoveryInterventionPackage, "replay" | "package_hash">): RecoveryInterventionReplayResult {
  const source = {
    replay_id: id("RIIRP", "recovery-intervention-replay-id", pkgBase.package_id),
    package_id: pkgBase.package_id,
    reconstructed_pipeline: freezeArray(PIPELINE),
    reconstructed_action: pkgBase.recommendation.recommended_action,
    reconstructed_priority: pkgBase.priority_assessment.intervention_priority,
    reconstructed_failures: pkgBase.validation.failures,
    evidence_hash: pkgBase.recommendation.integrity_hash,
    validation_state: pkgBase.validation.validation_state,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("recovery-intervention-replay", source) });
}

function packageHashSource(pkg: Omit<RecoveryInterventionPackage, "package_hash">) {
  return {
    package_id: pkg.package_id,
    engine_version: pkg.engine_version,
    runtime_package_id: pkg.source_runtime_package.package_id,
    governance_package_id: pkg.source_governance_package.package_id,
    option_hashes: pkg.option_assessments.map((item) => item.assessment_hash),
    confidence_hash: pkg.confidence_assessment.assessment_hash,
    priority_hash: pkg.priority_assessment.priority_hash,
    recommendation_hash: pkg.recommendation.integrity_hash,
    explainability_hash: pkg.explainability.explainability_hash,
    validation_hash: pkg.validation.validation_hash,
    replay_hash: pkg.replay.replay_hash,
    advisory_only: pkg.advisory_only,
  };
}

export function buildRecoveryInterventionPackage(input: { scenario?: RecoveryInterventionScenario; runtimePackage?: RuntimeAssurancePackage; governancePackage?: GovernanceAssurancePackage } = {}): RecoveryInterventionPackage {
  const scenario = input.scenario ?? "BASELINE";
  const source_runtime_package = input.runtimePackage ?? buildRuntimeAssurancePackage({ scenario: runtimeScenarioFor(scenario) });
  const source_governance_package = input.governancePackage ?? buildGovernanceAssurancePackage({ scenario: governanceScenarioFor(scenario), runtimePackage: source_runtime_package });
  const failures = collectFailures(source_runtime_package, source_governance_package, scenario);
  const package_id = id("RIIPKG", "recovery-intervention-package-id", { runtime: source_runtime_package.package_id, governance: source_governance_package.package_id, scenario });
  const option_assessments = buildOptions(package_id, failures);
  const confidence_assessment = buildConfidence(package_id, option_assessments, failures);
  const priority_assessment = buildPriority(package_id, failures);
  const recommendation = buildRecommendation(package_id, source_runtime_package, source_governance_package, option_assessments, confidence_assessment, priority_assessment, failures, scenario);
  const explainability = buildExplainability(package_id, recommendation, source_runtime_package, source_governance_package);
  const base = {
    package_id,
    engine_version: ENGINE_VERSION,
    source_runtime_package,
    source_governance_package,
    pipeline_state: recommendation.recommended_action,
    option_assessments,
    confidence_assessment,
    priority_assessment,
    recommendation,
    explainability,
    advisory_only: true as const,
    recovery_executed: false as const,
    workflow_modified: false as const,
    approval_granted: false as const,
    authority_modified: false as const,
    governance_bypassed: false as const,
  };
  const validation = validatePackage(base);
  const withValidation = { ...base, validation };
  const replay = replayPackage(withValidation);
  const full = { ...withValidation, replay };
  return Object.freeze({ ...full, package_hash: hashValue("recovery-intervention-package", packageHashSource(full)) });
}

export function buildRecoveryInterventionDashboardSurface(pkg = buildRecoveryInterventionPackage()): RecoveryInterventionDashboardSurface {
  return Object.freeze({
    package_id: pkg.package_id,
    execution_id: pkg.recommendation.execution_id,
    pipeline_state: pkg.pipeline_state,
    recommended_action: pkg.recommendation.recommended_action,
    intervention_priority: pkg.recommendation.intervention_priority,
    recovery_confidence: pkg.recommendation.recovery_confidence,
    rollback_confidence: pkg.recommendation.rollback_confidence,
    operator_required: pkg.recommendation.operator_required,
    validation_state: pkg.validation.validation_state,
    integrity_status: pkg.validation.integrity_verified ? "VALID" : "INVALID",
  });
}

export function getRecoveryInterventionFramework(): RecoveryInterventionFramework {
  const pkg = buildRecoveryInterventionPackage();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["advisory-only-intelligence", "operator-approval-mandatory", "constitution-overrides-optimization", "governance-overrides-autonomy", "evidence-before-recommendation", "deterministic-recommendations", "complete-explainability", "immutable-lineage", "tenant-isolation", "fail-closed"]),
      engine_version: ENGINE_VERSION,
      states: freezeArray(["INITIALIZING", "COLLECTING_EVIDENCE", "ANALYZING_FAILURE", "EVALUATING_OPTIONS", "ESTIMATING_CONFIDENCE", "PRIORITIZING_INTERVENTION", "GENERATING_RECOMMENDATION", "AWAITING_GOVERNANCE", "CONTINUE", "RETRY", "PAUSE", "ROLLBACK", "ALTERNATE_PLAN", "ESCALATE", "TERMINATE", "CLOSED"] as const),
      actions: freezeArray(["CONTINUE", "RETRY", "PAUSE", "ROLLBACK", "ALTERNATE_PLAN", "ESCALATE", "TERMINATE"] as const),
      priorities: freezeArray(["P1_CRITICAL", "P2_HIGH", "P3_MEDIUM", "P4_LOW", "P5_INFORMATIONAL"] as const),
    }),
    package: pkg,
    dashboard: buildRecoveryInterventionDashboardSurface(pkg),
  });
}
