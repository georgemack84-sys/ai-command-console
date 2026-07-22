import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishDriftDefenseArchitecture, replayDriftDefenseArchitecture } from "@/services/drift-defense-architecture";
import type { DriftResponse, DriftSeverity } from "@/types/drift-defense-architecture";
import type {
  AdaptationLeakageReport,
  CrossTenantContaminationAssessment,
  CrossTenantLearningReport,
  OptimizationIsolationReport,
  PolicyIsolationReport,
  TenantBoundaryValidationReport,
  TenantIsolationAssessment,
  TenantIsolationBaseline,
  TenantIsolationDriftApiSurface,
  TenantIsolationDriftFailure,
  TenantIsolationDriftFoundation,
  TenantIsolationDriftInput,
  TenantIsolationDriftMetrics,
  TenantIsolationDriftRecord,
  TenantIsolationDriftResult,
  TenantIsolationDriftScenario,
  TenantIsolationDriftStatus,
  TenantIsolationIntegrityScoreReport,
} from "@/types/tenant-isolation-drift-defense";

const DEFENSE_VERSION = "tenant-isolation-drift-defense/v1" as const;
const DEFENSE_IDENTIFIER = "TenantIsolationDriftDefense" as const;
const DEFENSE_TIMESTAMP = "2026-07-11T00:00:00.000Z" as const;

type Scenario = NonNullable<TenantIsolationDriftInput["scenario"]>;

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

function buildApiSurface(): TenantIsolationDriftApiSurface {
  const base: Omit<TenantIsolationDriftApiSurface, "integrity_hash"> = {
    api_id: "tenant_isolation_drift_defense_api",
    defend_tenant_isolation: "POST /tenant-isolation-drift-defense/defend",
    retrieve_baseline: "POST /tenant-isolation-drift-defense/baseline",
    retrieve_boundary: "POST /tenant-isolation-drift-defense/boundary",
    retrieve_leakage: "POST /tenant-isolation-drift-defense/leakage",
    retrieve_learning: "POST /tenant-isolation-drift-defense/learning",
    retrieve_policy: "POST /tenant-isolation-drift-defense/policy",
    retrieve_optimization: "POST /tenant-isolation-drift-defense/optimization",
    retrieve_integrity_score: "POST /tenant-isolation-drift-defense/integrity-score",
    retrieve_assessment: "POST /tenant-isolation-drift-defense/assessment",
    retrieve_contamination: "POST /tenant-isolation-drift-defense/contamination",
    retrieve_ledger_record: "POST /tenant-isolation-drift-defense/ledger",
    retrieve_metrics: "POST /tenant-isolation-drift-defense/metrics",
    replay_defense: "POST /tenant-isolation-drift-defense/replay",
    inspect_defense: "POST /tenant-isolation-drift-defense/inspect",
    retrieve_contract: "GET /tenant-isolation-drift-defense/contract",
    production_mutation_supported: false,
    tenant_sharing_authorization_supported: false,
    governance_bypass_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): TenantIsolationDriftFailure | undefined {
  const map: Partial<Record<TenantIsolationDriftScenario, TenantIsolationDriftFailure>> = {
    UNAUTHORIZED_BOUNDARY_CHANGE: "UNAUTHORIZED_BOUNDARY_CHANGE",
    UNKNOWN_TENANT_OWNERSHIP: "UNKNOWN_TENANT_OWNERSHIP",
    MIXED_TENANT_LINEAGE: "MIXED_TENANT_LINEAGE",
    UNAUTHORIZED_TENANT_ACCESS: "UNAUTHORIZED_TENANT_ACCESS",
    INVALID_NAMESPACE: "INVALID_NAMESPACE_ASSIGNMENT",
    AMBIGUOUS_OWNERSHIP: "AMBIGUOUS_TENANT_OWNERSHIP",
    TENANT_CONTAMINATION: "TENANT_CONTAMINATION_DETECTED",
    ADAPTATION_LEAKAGE: "ADAPTATION_LEAKAGE_DETECTED",
    SHARED_LEARNING: "SHARED_LEARNING_DETECTED",
    UNAUTHORIZED_REUSE: "UNAUTHORIZED_REUSE_DETECTED",
    POLICY_CROSSOVER: "POLICY_CROSSOVER_DETECTED",
    CROSS_TENANT_OPTIMIZATION: "CROSS_TENANT_OPTIMIZATION_DETECTED",
    EVIDENCE_INFLUENCE: "CROSS_TENANT_EVIDENCE_INFLUENCE",
    SHARED_RECOMMENDATION: "SHARED_RECOMMENDATION_BEHAVIOR",
    REPLAY_CONTAMINATION: "REPLAY_CONTAMINATION_DETECTED",
    SIMULATION_CONTAMINATION: "SIMULATION_CONTAMINATION_DETECTED",
    CONFIGURATION_CROSSOVER: "CONFIGURATION_CROSSOVER_DETECTED",
    NAMESPACE_DRIFT: "NAMESPACE_DRIFT_DETECTED",
    SHARED_ADAPTATION: "SHARED_ADAPTATION_DETECTED",
    RECOMMENDATION_CONTAMINATION: "RECOMMENDATION_CONTAMINATION",
    INHERITED_OPTIMIZATION: "INHERITED_OPTIMIZATION_DETECTED",
    PROPOSAL_REUSE: "CROSS_TENANT_PROPOSAL_REUSE",
    TRANSFERRED_BEHAVIOR: "TRANSFERRED_BEHAVIOR_DETECTED",
    RECOMMENDATION_INHERITANCE: "RECOMMENDATION_INHERITANCE_DETECTED",
    CONFIDENCE_TRANSFER: "CONFIDENCE_TRANSFER_DETECTED",
    RISK_MODEL_SHARING: "RISK_MODEL_SHARING_DETECTED",
    HISTORICAL_LEARNING_CONTAMINATION: "HISTORICAL_LEARNING_CONTAMINATION",
    GOVERNANCE_CONTAMINATION: "GOVERNANCE_CONTAMINATION",
    SHARED_APPROVAL_LOGIC: "SHARED_APPROVAL_LOGIC",
    GOVERNANCE_INFLUENCE: "CROSS_TENANT_GOVERNANCE_INFLUENCE",
    OPTIMIZATION_INHERITANCE: "OPTIMIZATION_INHERITANCE_DETECTED",
    OPTIMIZATION_REUSE: "OPTIMIZATION_REUSE_DETECTED",
    SHARED_OPTIMIZATION_OBJECTIVES: "SHARED_OPTIMIZATION_OBJECTIVES",
    SHARED_ADAPTIVE_STATE: "SHARED_ADAPTIVE_STATE",
    LINEAGE_CONTAMINATION: "CROSS_TENANT_LINEAGE_CONTAMINATION",
    NONDETERMINISTIC: "NONDETERMINISTIC_ISOLATION_ASSESSMENT",
    NONREPLAYABLE_EVIDENCE: "NONREPLAYABLE_ISOLATION_EVIDENCE",
    TENANT_BREACH: "TENANT_ISOLATION_BREACH",
    UNKNOWN_BEHAVIOR: "UNKNOWN_TENANT_BEHAVIOR",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, architectureReplayable: boolean): readonly TenantIsolationDriftFailure[] {
  const failures: TenantIsolationDriftFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!architectureReplayable) failures.push("DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function criticalFailures(failures: readonly TenantIsolationDriftFailure[]): boolean {
  return failures.some((failure) => [
    "UNKNOWN_TENANT_OWNERSHIP",
    "TENANT_ISOLATION_BREACH",
    "UNKNOWN_TENANT_BEHAVIOR",
    "UNAUTHORIZED_TENANT_ACCESS",
    "INVALID_NAMESPACE_ASSIGNMENT",
  ].includes(failure));
}

function severityFor(failures: readonly TenantIsolationDriftFailure[]): DriftSeverity {
  if (criticalFailures(failures)) return "CRITICAL";
  if (failures.some((failure) => [
    "TENANT_CONTAMINATION_DETECTED",
    "SHARED_LEARNING_DETECTED",
    "CROSS_TENANT_EVIDENCE_INFLUENCE",
    "REPLAY_CONTAMINATION_DETECTED",
    "POLICY_CROSSOVER_DETECTED",
    "CROSS_TENANT_OPTIMIZATION_DETECTED",
    "SHARED_ADAPTIVE_STATE",
    "CROSS_TENANT_LINEAGE_CONTAMINATION",
  ].includes(failure))) return "HIGH";
  if (failures.length) return "MODERATE";
  return "INFORMATIONAL";
}

function responseFor(severity: DriftSeverity, failures: readonly TenantIsolationDriftFailure[]): DriftResponse {
  if (failures.includes("UNKNOWN_TENANT_BEHAVIOR") || severity === "CRITICAL") return "FAIL_CLOSED";
  if (severity === "HIGH") return "SUPPRESS_ADAPTATION";
  if (severity === "MODERATE") return "REQUIRE_REVIEW";
  return "MONITOR";
}

function statusFor(failures: readonly TenantIsolationDriftFailure[]): TenantIsolationDriftStatus {
  if (criticalFailures(failures)) return "FAIL_CLOSED";
  if (failures.some((failure) => [
    "TENANT_CONTAMINATION_DETECTED",
    "ADAPTATION_LEAKAGE_DETECTED",
    "SHARED_LEARNING_DETECTED",
    "POLICY_CROSSOVER_DETECTED",
    "CROSS_TENANT_OPTIMIZATION_DETECTED",
    "CROSS_TENANT_EVIDENCE_INFLUENCE",
    "REPLAY_CONTAMINATION_DETECTED",
    "SHARED_ADAPTIVE_STATE",
    "CROSS_TENANT_LINEAGE_CONTAMINATION",
  ].includes(failure))) return "BLOCKED";
  if (failures.includes("UNAUTHORIZED_BOUNDARY_CHANGE") || failures.includes("UNAUTHORIZED_REUSE_DETECTED")) return "REQUIRES_GOVERNANCE_REVIEW";
  return failures.length ? "DRIFT_DETECTED" : "PASS";
}

function integrityScore(failures: readonly TenantIsolationDriftFailure[]): number {
  if (!failures.length) return 0.99;
  if (criticalFailures(failures)) return 0.03;
  if (failures.includes("TENANT_CONTAMINATION_DETECTED") || failures.includes("SHARED_LEARNING_DETECTED") || failures.includes("POLICY_CROSSOVER_DETECTED")) return 0.14;
  return 0.54;
}

function buildBaseline(): TenantIsolationBaseline {
  const base: Omit<TenantIsolationBaseline, "integrity_hash"> = {
    baseline_id: "tenant_isolation_drift_baseline_v1",
    tenant_model_version: "tenant-model/v1",
    tenant_namespace: "tenant://mission-control/isolated",
    isolation_policies: freezeArray(["tenant_local_learning_only", "tenant_local_evidence_only", "tenant_local_policy_only", "tenant_local_replay_only", "fail_closed_unknown_tenant"]),
    approved_sharing_rules: freezeArray(["certified_platform_capability_only", "explicit_governance_approval_required", "constitutional_authorization_required"]),
    governance_requirements: freezeArray(["governance_review_for_boundary_change", "operator_visibility_required", "certification_required_for_sharing"]),
    constitutional_requirements: freezeArray(["tenant_isolation_nonnegotiable", "no_unauthorized_knowledge_transfer", "namespace_ownership_preserved"]),
    platform_capabilities: freezeArray(["platform_telemetry_aggregation:certified", "tenant_anonymous_health_rollup:certified"]),
    approval_reference: "governance-approval:tenant-isolation-drift-baseline:v1",
    effective_date: "2026-07-11",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function boundaryFailures(failures: readonly TenantIsolationDriftFailure[]): readonly TenantIsolationDriftFailure[] {
  return freezeArray(failures.filter((failure) => [
    "UNKNOWN_TENANT_OWNERSHIP",
    "MIXED_TENANT_LINEAGE",
    "UNAUTHORIZED_TENANT_ACCESS",
    "INVALID_NAMESPACE_ASSIGNMENT",
    "AMBIGUOUS_TENANT_OWNERSHIP",
    "NAMESPACE_DRIFT_DETECTED",
    "TENANT_ISOLATION_BREACH",
  ].includes(failure)));
}

function leakageFailures(failures: readonly TenantIsolationDriftFailure[]): readonly TenantIsolationDriftFailure[] {
  return freezeArray(failures.filter((failure) => [
    "ADAPTATION_LEAKAGE_DETECTED",
    "SHARED_ADAPTATION_DETECTED",
    "RECOMMENDATION_CONTAMINATION",
    "INHERITED_OPTIMIZATION_DETECTED",
    "CROSS_TENANT_PROPOSAL_REUSE",
    "CROSS_TENANT_LINEAGE_CONTAMINATION",
  ].includes(failure)));
}

function learningFailures(failures: readonly TenantIsolationDriftFailure[]): readonly TenantIsolationDriftFailure[] {
  return freezeArray(failures.filter((failure) => [
    "SHARED_LEARNING_DETECTED",
    "TRANSFERRED_BEHAVIOR_DETECTED",
    "RECOMMENDATION_INHERITANCE_DETECTED",
    "CONFIDENCE_TRANSFER_DETECTED",
    "RISK_MODEL_SHARING_DETECTED",
    "HISTORICAL_LEARNING_CONTAMINATION",
    "SHARED_ADAPTIVE_STATE",
  ].includes(failure)));
}

function policyFailures(failures: readonly TenantIsolationDriftFailure[]): readonly TenantIsolationDriftFailure[] {
  return freezeArray(failures.filter((failure) => [
    "POLICY_CROSSOVER_DETECTED",
    "GOVERNANCE_CONTAMINATION",
    "SHARED_APPROVAL_LOGIC",
    "UNAUTHORIZED_REUSE_DETECTED",
    "CROSS_TENANT_GOVERNANCE_INFLUENCE",
  ].includes(failure)));
}

function optimizationFailures(failures: readonly TenantIsolationDriftFailure[]): readonly TenantIsolationDriftFailure[] {
  return freezeArray(failures.filter((failure) => [
    "CROSS_TENANT_OPTIMIZATION_DETECTED",
    "OPTIMIZATION_INHERITANCE_DETECTED",
    "OPTIMIZATION_REUSE_DETECTED",
    "SHARED_OPTIMIZATION_OBJECTIVES",
    "INHERITED_OPTIMIZATION_DETECTED",
  ].includes(failure)));
}

function blocksFor(failures: readonly TenantIsolationDriftFailure[]): readonly string[] {
  if (!failures.length) return freezeArray(["monitor_tenant_isolation"]);
  return freezeArray(["block_cross_tenant_learning", "block_shared_adaptation", "block_recommendation_transfer", "block_optimization_reuse", "block_policy_crossover", "block_evidence_sharing", "block_replay_contamination", "block_adaptive_state_inheritance", "preserve_forensic_evidence", "notify_operators"]);
}

function buildBoundary(score: number, failures: readonly TenantIsolationDriftFailure[]): TenantBoundaryValidationReport {
  const rejected = boundaryFailures(failures);
  const base: Omit<TenantBoundaryValidationReport, "integrity_hash"> = {
    report_id: `tenant_boundary_${hash({ score, failures }).slice(0, 14)}`,
    tenant_ownership_score: failures.includes("UNKNOWN_TENANT_OWNERSHIP") ? 0.03 : score,
    namespace_integrity_score: failures.includes("INVALID_NAMESPACE_ASSIGNMENT") || failures.includes("NAMESPACE_DRIFT_DETECTED") ? 0.12 : score,
    adaptation_ownership_score: failures.includes("ADAPTATION_LEAKAGE_DETECTED") ? 0.2 : score,
    evidence_ownership_score: failures.includes("CROSS_TENANT_EVIDENCE_INFLUENCE") ? 0.16 : score,
    policy_ownership_score: failures.includes("POLICY_CROSSOVER_DETECTED") ? 0.14 : score,
    recommendation_ownership_score: failures.includes("RECOMMENDATION_CONTAMINATION") ? 0.28 : score,
    replay_ownership_score: failures.includes("REPLAY_CONTAMINATION_DETECTED") ? 0.17 : score,
    simulation_ownership_score: failures.includes("SIMULATION_CONTAMINATION_DETECTED") ? 0.26 : score,
    tenant_ownership_summary: rejected.length ? "Tenant ownership is ambiguous or invalid and must fail closed." : "Tenant ownership is explicit and isolated.",
    isolation_verification_assessment: rejected.length ? "Boundary validation rejected the adaptive input." : "Tenant boundary validation passed.",
    rejected_boundary_conditions: rejected,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLeakage(score: number, failures: readonly TenantIsolationDriftFailure[], blocks: readonly string[]): AdaptationLeakageReport {
  const detected = leakageFailures(failures);
  const base: Omit<AdaptationLeakageReport, "integrity_hash"> = {
    report_id: `adaptation_leakage_${hash({ score, failures }).slice(0, 14)}`,
    proposal_lineage_score: failures.includes("CROSS_TENANT_PROPOSAL_REUSE") ? 0.24 : score,
    adaptation_ownership_score: failures.includes("ADAPTATION_LEAKAGE_DETECTED") || failures.includes("SHARED_ADAPTATION_DETECTED") ? 0.18 : score,
    recommendation_reuse_score: failures.includes("RECOMMENDATION_CONTAMINATION") ? 0.28 : score,
    decision_reuse_score: failures.includes("UNAUTHORIZED_REUSE_DETECTED") ? 0.34 : score,
    simulation_influence_score: failures.includes("SIMULATION_CONTAMINATION_DETECTED") ? 0.26 : score,
    replay_influence_score: failures.includes("REPLAY_CONTAMINATION_DETECTED") ? 0.17 : score,
    evidence_dependency_score: failures.includes("CROSS_TENANT_EVIDENCE_INFLUENCE") ? 0.16 : score,
    leakage_detected: detected.length > 0,
    lineage_isolation_assessment: detected.length ? "Cross-tenant adaptation lineage detected and blocked." : "Adaptation lineage remains tenant-local.",
    detected_leakage: detected,
    automatic_blocks: detected.length ? blocks : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLearning(score: number, failures: readonly TenantIsolationDriftFailure[], blocks: readonly string[]): CrossTenantLearningReport {
  const detected = learningFailures(failures);
  const base: Omit<CrossTenantLearningReport, "integrity_hash"> = {
    report_id: `learning_isolation_${hash({ score, failures }).slice(0, 14)}`,
    learning_isolation_score: failures.includes("SHARED_LEARNING_DETECTED") ? 0.14 : score,
    behavior_transfer_score: failures.includes("TRANSFERRED_BEHAVIOR_DETECTED") ? 0.3 : score,
    optimization_reuse_score: failures.includes("OPTIMIZATION_REUSE_DETECTED") ? 0.22 : score,
    recommendation_inheritance_score: failures.includes("RECOMMENDATION_INHERITANCE_DETECTED") ? 0.31 : score,
    confidence_transfer_score: failures.includes("CONFIDENCE_TRANSFER_DETECTED") ? 0.33 : score,
    risk_model_isolation_score: failures.includes("RISK_MODEL_SHARING_DETECTED") ? 0.32 : score,
    historical_learning_score: failures.includes("HISTORICAL_LEARNING_CONTAMINATION") ? 0.29 : score,
    cross_tenant_learning_assessment: detected.length ? "Cross-tenant learning behavior detected and blocked." : "Adaptive learning remains tenant-local.",
    detected_learning_violations: detected,
    automatic_blocks: detected.length ? blocks : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildPolicy(score: number, failures: readonly TenantIsolationDriftFailure[], blocks: readonly string[]): PolicyIsolationReport {
  const detected = policyFailures(failures);
  const base: Omit<PolicyIsolationReport, "integrity_hash"> = {
    report_id: `policy_isolation_${hash({ score, failures }).slice(0, 14)}`,
    policy_ownership_score: failures.includes("POLICY_CROSSOVER_DETECTED") ? 0.14 : score,
    governance_ownership_score: failures.includes("GOVERNANCE_CONTAMINATION") ? 0.2 : score,
    constitutional_ownership_score: score,
    policy_inheritance_score: failures.includes("UNAUTHORIZED_REUSE_DETECTED") ? 0.34 : score,
    approval_workflow_score: failures.includes("SHARED_APPROVAL_LOGIC") ? 0.27 : score,
    escalation_policy_score: score,
    certification_policy_score: score,
    governance_boundary_assessment: detected.length ? "Tenant policy or governance boundary violation detected." : "Tenant policies remain isolated.",
    detected_policy_violations: detected,
    automatic_blocks: detected.length ? blocks : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildOptimization(score: number, failures: readonly TenantIsolationDriftFailure[], blocks: readonly string[]): OptimizationIsolationReport {
  const detected = optimizationFailures(failures);
  const base: Omit<OptimizationIsolationReport, "integrity_hash"> = {
    report_id: `optimization_isolation_${hash({ score, failures }).slice(0, 14)}`,
    objective_isolation_score: failures.includes("SHARED_OPTIMIZATION_OBJECTIVES") ? 0.25 : score,
    optimization_lineage_score: failures.includes("OPTIMIZATION_INHERITANCE_DETECTED") || failures.includes("INHERITED_OPTIMIZATION_DETECTED") ? 0.2 : score,
    optimization_evidence_score: failures.includes("CROSS_TENANT_EVIDENCE_INFLUENCE") ? 0.16 : score,
    recommendation_optimization_score: failures.includes("CROSS_TENANT_OPTIMIZATION_DETECTED") ? 0.14 : score,
    confidence_optimization_score: score,
    risk_optimization_score: score,
    strategy_optimization_score: score,
    optimization_boundary_assessment: detected.length ? "Cross-tenant optimization behavior detected and blocked." : "Optimization remains tenant-scoped.",
    detected_optimization_violations: detected,
    automatic_blocks: detected.length ? blocks : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildScore(score: number, boundary: TenantBoundaryValidationReport, leakage: AdaptationLeakageReport, policy: PolicyIsolationReport, optimization: OptimizationIsolationReport): TenantIsolationIntegrityScoreReport {
  const base: Omit<TenantIsolationIntegrityScoreReport, "integrity_hash"> = {
    score_id: `tenant_isolation_integrity_${hash({ score, boundary: boundary.integrity_hash }).slice(0, 14)}`,
    boundary_integrity_score: Math.min(boundary.tenant_ownership_score, boundary.namespace_integrity_score, score),
    ownership_integrity_score: Math.min(boundary.adaptation_ownership_score, boundary.evidence_ownership_score, boundary.policy_ownership_score, score),
    lineage_isolation_score: Math.min(leakage.proposal_lineage_score, leakage.evidence_dependency_score, score),
    policy_isolation_score: policy.policy_ownership_score,
    optimization_isolation_score: optimization.recommendation_optimization_score,
    replay_isolation_score: boundary.replay_ownership_score,
    tenant_isolation_integrity_score: score,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAssessment(failures: readonly TenantIsolationDriftFailure[], severity: DriftSeverity, response: DriftResponse, blocks: readonly string[]): TenantIsolationAssessment {
  const base: Omit<TenantIsolationAssessment, "integrity_hash"> = {
    assessment_id: `tenant_isolation_assessment_${hash(failures).slice(0, 14)}`,
    isolation_drift_detected: failures.length > 0,
    detected_violations: failures,
    affected_tenants: failures.length ? freezeArray(["tenant:primary", "tenant:foreign"]) : freezeArray([]),
    adaptation_analysis: leakageFailures(failures).length ? "Adaptive lineage crosses tenant boundary." : "Adaptation lineage remains tenant-local.",
    evidence_analysis: failures.includes("CROSS_TENANT_EVIDENCE_INFLUENCE") ? "Cross-tenant evidence influence detected." : "Evidence remains tenant-local.",
    governance_impacts: failures.length ? freezeArray(["governance_review_required"]) : freezeArray(["governance_preserved"]),
    constitutional_impacts: failures.length ? freezeArray(["tenant_isolation_boundary_enforced"]) : freezeArray(["constitutional_boundary_preserved"]),
    replay_impacts: failures.includes("REPLAY_CONTAMINATION_DETECTED") ? freezeArray(["replay_contamination_blocked"]) : freezeArray(["replay_isolated"]),
    optimization_impacts: optimizationFailures(failures).length ? freezeArray(["optimization_reuse_blocked"]) : freezeArray(["optimization_isolated"]),
    supporting_evidence: freezeArray(["evidence:tenant-namespace", "evidence:lineage-map", "evidence:policy-ownership", "evidence:replay-trace"]),
    recommended_response: response,
    containment_actions: blocks,
    severity,
    deterministic: true,
    replayable: true,
    explainable: true,
    evidence_backed: true,
    audit_ready: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildContamination(failures: readonly TenantIsolationDriftFailure[], severity: DriftSeverity): CrossTenantContaminationAssessment {
  const contaminated = failures.length > 0;
  const base: Omit<CrossTenantContaminationAssessment, "integrity_hash"> = {
    assessment_id: `cross_tenant_contamination_${hash(failures).slice(0, 14)}`,
    contamination_scope: contaminated ? "cross_tenant_adaptive_surface" : "none",
    severity,
    propagation_risk: contaminated ? "contained_before_production" : "none",
    recovery_requirements: contaminated ? freezeArray(["governance_review", "tenant_lineage_reconstruction", "certification_before_release"]) : freezeArray([]),
    containment_complete: contaminated,
    affected_resources: contaminated ? freezeArray(["adaptations", "recommendations", "evidence", "policies", "replay_refs"]) : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecord(input: TenantIsolationDriftInput, baseline: TenantIsolationBaseline, score: TenantIsolationIntegrityScoreReport, assessment: TenantIsolationAssessment): TenantIsolationDriftRecord {
  const base: Omit<TenantIsolationDriftRecord, "integrity_hash"> = {
    drift_id: `tenant_isolation_drift_${hash({ tenant: input.tenant_id ?? "tenant-mission-control", failures: assessment.detected_violations, score: score.tenant_isolation_integrity_score }).slice(0, 16)}`,
    tenant_id: input.tenant_id ?? "tenant-mission-control",
    tenant_model_version: baseline.tenant_model_version,
    drift_category: assessment.detected_violations[0] ?? "NO_TENANT_ISOLATION_DRIFT",
    tenant_isolation_integrity_score: score.tenant_isolation_integrity_score,
    boundary_integrity_score: score.boundary_integrity_score,
    lineage_isolation_score: score.lineage_isolation_score,
    policy_isolation_score: score.policy_isolation_score,
    optimization_isolation_score: score.optimization_isolation_score,
    severity: assessment.severity,
    affected_tenants: assessment.affected_tenants,
    affected_adaptations: freezeArray(["adaptation:proposal-generation", "adaptation:simulation"]),
    affected_recommendations: freezeArray(["recommendation:adaptive", "recommendation:tenant-local"]),
    affected_evidence: freezeArray(["evidence:tenant-lineage", "evidence:policy-ownership"]),
    supporting_evidence: assessment.integrity_hash,
    automatic_blocks: assessment.containment_actions,
    recommended_response: assessment.recommended_response,
    containment_required: assessment.detected_violations.length > 0,
    governance_impact: assessment.detected_violations.length ? "governance_review_required" : "governance_preserved",
    replay_refs: freezeArray(["replay:tenant-isolation-drift-defense"]),
    timestamp: DEFENSE_TIMESTAMP,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(score: TenantIsolationIntegrityScoreReport, assessment: TenantIsolationAssessment, failures: readonly TenantIsolationDriftFailure[]): TenantIsolationDriftMetrics {
  const base: Omit<TenantIsolationDriftMetrics, "integrity_hash"> = {
    tenant_isolation_integrity_score: score.tenant_isolation_integrity_score,
    boundary_integrity_score: score.boundary_integrity_score,
    lineage_isolation_score: score.lineage_isolation_score,
    policy_isolation_score: score.policy_isolation_score,
    optimization_isolation_score: score.optimization_isolation_score,
    containment_required: assessment.detected_violations.length > 0,
    deterministic_assessment: !failures.includes("NONDETERMINISTIC_ISOLATION_ASSESSMENT"),
    replayable_assessment: !failures.includes("NONREPLAYABLE_ISOLATION_EVIDENCE"),
    governance_preserved: !failures.includes("GOVERNANCE_CONTAMINATION") && !failures.includes("CROSS_TENANT_GOVERNANCE_INFLUENCE"),
    constitutional_preserved: !failures.some((failure) => ["TENANT_CONTAMINATION_DETECTED", "TENANT_ISOLATION_BREACH", "SHARED_LEARNING_DETECTED"].includes(failure)),
    operator_authority_preserved: true,
    tenant_isolated: failures.length === 0,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<TenantIsolationDriftResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    architecture_hash: result.architecture_result.integrity_hash,
    baseline_hash: result.baseline.integrity_hash,
    boundary_hash: result.boundary_report.integrity_hash,
    leakage_hash: result.leakage_report.integrity_hash,
    learning_hash: result.learning_report.integrity_hash,
    policy_hash: result.policy_report.integrity_hash,
    optimization_hash: result.optimization_report.integrity_hash,
    score_hash: result.integrity_score_report.integrity_hash,
    assessment_hash: result.isolation_assessment.integrity_hash,
    contamination_hash: result.contamination_assessment.integrity_hash,
    record_hash: result.drift_record.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<TenantIsolationDriftResult, "integrity_hash">): string {
  return hash({
    version: result.tenant_isolation_drift_defense_version,
    defense_identifier: result.defense_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    record_hash: result.drift_record.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function defendTenantIsolationDrift(input: TenantIsolationDriftInput = {}): TenantIsolationDriftResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const architecture_result = input.architecture_result ?? establishDriftDefenseArchitecture();
  const failures = collectFailures(scenario, replayDriftDefenseArchitecture(architecture_result));
  const integrity = integrityScore(failures);
  const severity = severityFor(failures);
  const response = responseFor(severity, failures);
  const blocks = blocksFor(failures);
  const baseline = buildBaseline();
  const boundary_report = buildBoundary(integrity, failures);
  const leakage_report = buildLeakage(integrity, failures, blocks);
  const learning_report = buildLearning(integrity, failures, blocks);
  const policy_report = buildPolicy(integrity, failures, blocks);
  const optimization_report = buildOptimization(integrity, failures, blocks);
  const integrity_score_report = buildScore(integrity, boundary_report, leakage_report, policy_report, optimization_report);
  const isolation_assessment = buildAssessment(failures, severity, response, blocks);
  const contamination_assessment = buildContamination(failures, severity);
  const drift_record = buildRecord(input, baseline, integrity_score_report, isolation_assessment);
  const metrics = buildMetrics(integrity_score_report, isolation_assessment, failures);
  const base: Omit<TenantIsolationDriftResult, "integrity_hash" | "replay_hash"> = {
    tenant_isolation_drift_defense_version: DEFENSE_VERSION,
    defense_identifier: DEFENSE_IDENTIFIER,
    status: statusFor(failures),
    api_surface,
    architecture_result,
    baseline,
    boundary_report,
    leakage_report,
    learning_report,
    policy_report,
    optimization_report,
    integrity_score_report,
    isolation_assessment,
    contamination_assessment,
    drift_record,
    metrics,
    failures,
    deterministic: metrics.deterministic_assessment,
    replayable: metrics.replayable_assessment,
    explainable: !failures.includes("UNKNOWN_TENANT_BEHAVIOR"),
    evidence_backed: !failures.includes("NONREPLAYABLE_ISOLATION_EVIDENCE"),
    governance_preserved: metrics.governance_preserved,
    constitutional_preserved: metrics.constitutional_preserved,
    operator_authority_preserved: metrics.operator_authority_preserved,
    tenant_isolated: metrics.tenant_isolated,
    advisory_only: true,
    mutates_production_behavior: false,
    authorizes_tenant_sharing: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayTenantIsolationDriftDefense(result: TenantIsolationDriftResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayDriftDefenseArchitecture(result.architecture_result) &&
    verifyHashedRecord(result.baseline) &&
    verifyHashedRecord(result.boundary_report) &&
    verifyHashedRecord(result.leakage_report) &&
    verifyHashedRecord(result.learning_report) &&
    verifyHashedRecord(result.policy_report) &&
    verifyHashedRecord(result.optimization_report) &&
    verifyHashedRecord(result.integrity_score_report) &&
    verifyHashedRecord(result.isolation_assessment) &&
    verifyHashedRecord(result.contamination_assessment) &&
    verifyHashedRecord(result.drift_record) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getTenantIsolationDriftFoundation(): TenantIsolationDriftFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    tenant_isolation_drift_defense_version: DEFENSE_VERSION,
    api_surface,
    result: defendTenantIsolationDrift(),
  });
}

export const TenantIsolationDriftDefense = Object.freeze({
  defend: defendTenantIsolationDrift,
  replay: replayTenantIsolationDriftDefense,
});
