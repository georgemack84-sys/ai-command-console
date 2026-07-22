import { createDecisionContext } from "@/services/decision-context-contract";
import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import { createEvidenceDependencyContextRequest, resolveEvidenceDependencyContext } from "@/services/decision-evidence-dependency-context";
import { createMissionTenantContextRequest, resolveMissionTenantContext } from "@/services/decision-mission-tenant-context";
import { createAuthorityOperatorContextRequest, resolveAuthorityOperatorContext } from "@/services/decision-authority-operator-context";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionContextDomain } from "@/types/decision-context-contract";
import type {
  ConfidenceCalibration,
  ConfidenceContext,
  ConfidenceExplainability,
  ConfidenceLevel,
  MitigationStatusRecord,
  RiskConfidenceContextPackage,
  RiskConfidenceContextRequest,
  RiskConfidenceFailureReason,
  RiskConfidenceObservability,
  RiskConfidenceReplayResult,
  RiskConfidenceResolutionState,
  RiskConfidenceValidationResult,
  RiskContext,
  RiskExplainability,
  RiskRecord,
  RiskSeverity,
  UncertaintyAnalysis,
} from "@/types/decision-risk-confidence-context";

const NOW = "2026-07-02T09:32:00.000Z";
const RESOLVER_VERSION = "risk-confidence-context-resolver/v1" as const;
const RESOLUTION_ORDER: readonly RiskConfidenceResolutionState[] = Object.freeze([
  "RISK_REGISTRY_RESOLVED",
  "ACTIVE_RISKS_RESOLVED",
  "RESIDUAL_RISKS_RESOLVED",
  "EMERGING_RISKS_RESOLVED",
  "MITIGATIONS_RESOLVED",
  "SEVERITY_RESOLVED",
  "EXPOSURE_ANALYZED",
  "RISK_VALIDATED",
  "CONFIDENCE_SOURCES_RESOLVED",
  "CALIBRATION_APPLIED",
  "UNCERTAINTY_ANALYZED",
  "CONFIDENCE_VALIDATED",
  "PASSED",
] as const);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function recordHash<T extends Record<string, unknown>>(value: T): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  return hash(copy);
}

function severityFor(exposure: number): RiskSeverity {
  if (exposure >= 0.85) return "Critical";
  if (exposure >= 0.65) return "High";
  if (exposure >= 0.4) return "Moderate";
  if (exposure >= 0.15) return "Low";
  return "Informational";
}

function confidenceLevel(value: number): ConfidenceLevel {
  if (value >= 0.9) return "Very High";
  if (value >= 0.75) return "High";
  if (value >= 0.55) return "Moderate";
  if (value >= 0.35) return "Low";
  return "Very Low";
}

function makeRisk(input: Omit<RiskRecord, "integrity_hash" | "severity" | "exposure">): RiskRecord {
  const exposure = Number((input.likelihood * input.impact).toFixed(6));
  const withSeverity = { ...input, exposure, severity: severityFor(exposure) };
  return Object.freeze({ ...withSeverity, integrity_hash: recordHash(withSeverity) });
}

const RISK_REGISTRY: readonly RiskRecord[] = Object.freeze([
  makeRisk({
    risk_id: "risk_tenant_alpha_mission_phase_9_dependency_waiting",
    tenant_id: "tenant_alpha",
    mission_id: "mission_phase_9_decision_orchestration",
    risk_type: "DEPENDENCY",
    risk_description: "Dependency prerequisite remains pending before orchestration.",
    likelihood: 0.6,
    impact: 0.7,
    evidence_refs: Object.freeze(["evidence_tenant_alpha_mission_phase_9_decision_orchestration_001"]),
    mitigation_ref: "mitigation_dependency_operator_review",
    lineage_refs: Object.freeze(["lineage_risk_dependency_phase_9_001"]),
    replay_refs: Object.freeze(["replay_risk_dependency_phase_9_001"]),
  }),
  makeRisk({
    risk_id: "risk_tenant_alpha_mission_phase_9_governance_conflict",
    tenant_id: "tenant_alpha",
    mission_id: "mission_phase_9_decision_orchestration",
    risk_type: "GOVERNANCE",
    risk_description: "Conflicting governance evidence requires preservation during review.",
    likelihood: 0.4,
    impact: 0.8,
    evidence_refs: Object.freeze(["evidence_tenant_alpha_mission_phase_9_decision_orchestration_conflict_001"]),
    mitigation_ref: "mitigation_governance_review",
    lineage_refs: Object.freeze(["lineage_risk_governance_phase_9_001"]),
    replay_refs: Object.freeze(["replay_risk_governance_phase_9_001"]),
  }),
  makeRisk({
    risk_id: "risk_tenant_alpha_mission_phase_9_runtime_emerging",
    tenant_id: "tenant_alpha",
    mission_id: "mission_phase_9_decision_orchestration",
    risk_type: "RUNTIME",
    risk_description: "Runtime telemetry shows watch-level variability.",
    likelihood: 0.25,
    impact: 0.4,
    evidence_refs: Object.freeze(["observation_tenant_alpha_mission_phase_9_decision_orchestration_001"]),
    mitigation_ref: "mitigation_runtime_monitoring",
    lineage_refs: Object.freeze(["lineage_risk_runtime_phase_9_001"]),
    replay_refs: Object.freeze(["replay_risk_runtime_phase_9_001"]),
  }),
  makeRisk({
    risk_id: "risk_tenant_beta_mission_phase_9_external",
    tenant_id: "tenant_beta",
    mission_id: "mission_phase_9_decision_orchestration",
    risk_type: "SECURITY",
    risk_description: "External tenant risk must not contaminate tenant alpha.",
    likelihood: 0.9,
    impact: 0.9,
    evidence_refs: Object.freeze(["evidence_tenant_beta_mission_phase_9_decision_orchestration_001"]),
    mitigation_ref: "mitigation_beta_external",
    lineage_refs: Object.freeze(["lineage_risk_beta_001"]),
    replay_refs: Object.freeze(["replay_risk_beta_001"]),
  }),
]);

const MITIGATION_REGISTRY = Object.freeze({
  mitigation_dependency_operator_review: Object.freeze({ mitigation_state: "PENDING" as const, mitigation_effectiveness: 0.65, recovery_linkage: "recovery_operator_review" }),
  mitigation_governance_review: Object.freeze({ mitigation_state: "AVAILABLE" as const, mitigation_effectiveness: 0.8, recovery_linkage: "recovery_governance_review" }),
  mitigation_runtime_monitoring: Object.freeze({ mitigation_state: "COMPLETED" as const, mitigation_effectiveness: 0.9, recovery_linkage: "recovery_runtime_monitoring" }),
  mitigation_beta_external: Object.freeze({ mitigation_state: "UNKNOWN" as const, mitigation_effectiveness: 0, recovery_linkage: "recovery_beta_external" }),
});

function defaultCandidate(): DecisionCandidate {
  const result = normalizeDecisionCandidateInput();
  if (!result.candidate) throw new Error("default normalized candidate unavailable");
  return result.candidate;
}

export function createRiskConfidenceContextRequest(overrides: Partial<RiskConfidenceContextRequest> = {}): RiskConfidenceContextRequest {
  const candidate = overrides.candidate ?? defaultCandidate();
  const mission_tenant_package = overrides.mission_tenant_package ?? resolveMissionTenantContext(createMissionTenantContextRequest({ candidate }));
  const authority_operator_package = overrides.authority_operator_package ?? resolveAuthorityOperatorContext(createAuthorityOperatorContextRequest({ candidate, mission_tenant_package }));
  return Object.freeze({
    resolution_id: overrides.resolution_id ?? `risk_confidence_resolution_${candidate.candidate_id}`,
    candidate,
    base_context: overrides.base_context ?? createDecisionContext({ candidate }),
    mission_tenant_package,
    authority_operator_package,
    evidence_dependency_package: overrides.evidence_dependency_package ?? resolveEvidenceDependencyContext(createEvidenceDependencyContextRequest({ candidate, mission_tenant_package, authority_operator_package })),
    resolver_version: overrides.resolver_version ?? RESOLVER_VERSION,
  });
}

function registryRisks(candidate: DecisionCandidate): readonly RiskRecord[] {
  const direct = new Set(candidate.risk_refs);
  const scoped = RISK_REGISTRY.filter((risk) => risk.tenant_id === candidate.tenant_id && risk.mission_id === candidate.mission_id);
  const requested = RISK_REGISTRY.filter((risk) => direct.has(risk.risk_id));
  return Object.freeze([...new Map([...scoped, ...requested].map((risk) => [risk.risk_id, risk])).values()].sort((left, right) => left.risk_id.localeCompare(right.risk_id)));
}

function mitigationStatus(risk: RiskRecord): MitigationStatusRecord {
  const registry = MITIGATION_REGISTRY[risk.mitigation_ref as keyof typeof MITIGATION_REGISTRY];
  const base: Omit<MitigationStatusRecord, "integrity_hash"> = {
    risk_id: risk.risk_id,
    mitigation_state: registry?.mitigation_state ?? "UNKNOWN",
    mitigation_effectiveness: registry?.mitigation_effectiveness ?? 0,
    recovery_linkage: registry?.recovery_linkage ?? "recovery_unavailable",
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function residualRisk(risk: RiskRecord, mitigation: MitigationStatusRecord): RiskRecord {
  const residualLikelihood = Number((risk.likelihood * (1 - mitigation.mitigation_effectiveness)).toFixed(6));
  return makeRisk({
    risk_id: `${risk.risk_id}_residual`,
    tenant_id: risk.tenant_id,
    mission_id: risk.mission_id,
    risk_type: risk.risk_type,
    risk_description: `Residual ${risk.risk_description}`,
    likelihood: residualLikelihood,
    impact: risk.impact,
    evidence_refs: risk.evidence_refs,
    mitigation_ref: risk.mitigation_ref,
    lineage_refs: Object.freeze([...risk.lineage_refs, `residual_${risk.risk_id}`]),
    replay_refs: risk.replay_refs,
  });
}

function riskExplainability(input: { candidate: DecisionCandidate; risks: readonly RiskRecord[]; mitigations: readonly MitigationStatusRecord[]; validation: readonly string[] }): RiskExplainability {
  const base: Omit<RiskExplainability, "integrity_hash"> = {
    supporting_evidence: Object.freeze(input.risks.flatMap((risk) => risk.evidence_refs).sort()),
    risk_rationale: `${input.risks.length} active risks resolved for ${input.candidate.candidate_id}.`,
    severity_reasoning: "Severity derives from deterministic likelihood multiplied by impact thresholds.",
    mitigation_rationale: input.mitigations.map((mitigation) => `${mitigation.risk_id}:${mitigation.mitigation_state}`).join(";"),
    governance_influence: input.candidate.governance_refs,
    constitutional_influence: Object.freeze(["constitution_risk_transparency_v1", "constitution_advisory_only_v1"]),
    validation_outcomes: input.validation,
    replay_references: Object.freeze(input.risks.flatMap((risk) => risk.replay_refs).sort()),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function uncertaintyAnalysis(input: { evidenceScore: number; dependencyBlocked: boolean; risks: readonly RiskRecord[] }): UncertaintyAnalysis {
  const data_gaps = Object.freeze([
    ...(input.evidenceScore < 0.9 ? ["evidence_quality_below_certified_threshold"] : []),
    ...(input.dependencyBlocked ? ["dependency_waiting"] : []),
  ]);
  const base: Omit<UncertaintyAnalysis, "integrity_hash"> = {
    evidence_uncertainty: Object.freeze(input.evidenceScore >= 0.9 ? [] : ["evidence_confidence_reduced"]),
    data_gaps,
    model_limitations: Object.freeze(["calibration_model_v1_static_thresholds"]),
    dependency_uncertainty: Object.freeze(input.dependencyBlocked ? ["prerequisite_pending"] : []),
    operational_variability: Object.freeze(input.risks.some((risk) => risk.risk_type === "RUNTIME") ? ["runtime_watch_variability"] : []),
    forecast_uncertainty: Object.freeze(["forecast_context_pending_phase_9_3_7"]),
    uncertainty_score: Number((data_gaps.length * 0.1 + input.risks.length * 0.03).toFixed(6)),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function calibration(input: { evidenceScore: number; riskExposure: number; validationPass: boolean; dependencyBlocked: boolean }): ConfidenceCalibration {
  const baseline = input.evidenceScore;
  const adjustments = Object.freeze([
    ...(input.riskExposure > 0.4 ? ["risk_exposure_adjustment_-0.08"] : []),
    ...(input.dependencyBlocked ? ["dependency_waiting_adjustment_-0.05"] : []),
    ...(!input.validationPass ? ["validation_failure_adjustment_-0.25"] : []),
  ]);
  const penalty = adjustments.reduce((sum, adjustment) => sum + Number(adjustment.match(/-0\.\d+/)?.[0] ?? 0), 0);
  const calibrated = Number(Math.max(0, Math.min(1, baseline + penalty)).toFixed(6));
  const base: Omit<ConfidenceCalibration, "integrity_hash"> = {
    calibration_model: "decision-confidence-calibration/v1",
    calibration_inputs: Object.freeze(["evidence_completeness", "evidence_quality", "replay_consistency", "risk_exposure", "validation_results"]),
    baseline_confidence: baseline,
    calibrated_confidence: calibrated,
    adjustments,
    calibration_lineage: Object.freeze(["calibration_model_v1", `baseline_${baseline}`, `calibrated_${calibrated}`]),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function confidenceExplainability(input: { calibration: ConfidenceCalibration; uncertainty: UncertaintyAnalysis; candidate: DecisionCandidate; validation: readonly string[] }): ConfidenceExplainability {
  const base: Omit<ConfidenceExplainability, "integrity_hash"> = {
    confidence_calculation: `baseline ${input.calibration.baseline_confidence} calibrated to ${input.calibration.calibrated_confidence}.`,
    calibration_adjustments: input.calibration.adjustments,
    uncertainty_factors: Object.freeze([...input.uncertainty.evidence_uncertainty, ...input.uncertainty.data_gaps, ...input.uncertainty.dependency_uncertainty]),
    governance_influence: input.candidate.governance_refs,
    constitutional_influence: Object.freeze(["constitution_confidence_transparency_v1", "constitution_no_hidden_adjustment_v1"]),
    validation_outcomes: input.validation,
    replay_references: Object.freeze([`replay_confidence_${input.candidate.candidate_id}`]),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function validationFor(request: RiskConfidenceContextRequest, risks: readonly RiskRecord[], mitigations: readonly MitigationStatusRecord[]): RiskConfidenceValidationResult {
  const evidencePkg = request.evidence_dependency_package;
  const evidenceScore = evidencePkg?.evidence_context.evidence_confidence ?? 0;
  const validationPass = evidencePkg?.validation.validation_status === "PASS";
  const crossTenant = risks.some((risk) => risk.tenant_id !== request.candidate.tenant_id);
  const failures: RiskConfidenceFailureReason[] = [
    ...(risks.length === 0 ? ["ACTIVE_RISKS_UNRESOLVED" as const] : []),
    ...(risks.some((risk) => risk.evidence_refs.length === 0) || evidenceScore === 0 ? ["RISK_EVIDENCE_UNAVAILABLE" as const] : []),
    ...(risks.some((risk) => !risk.severity) ? ["SEVERITY_UNCALCULABLE" as const] : []),
    ...(mitigations.some((mitigation) => mitigation.mitigation_state === "UNKNOWN") ? ["MITIGATION_STATUS_UNKNOWN" as const] : []),
    ...(risks.some((risk) => !Number.isFinite(risk.exposure)) ? ["EXPOSURE_UNCALCULABLE" as const] : []),
    ...(evidencePkg?.evidence_context.evidence_lineage.length ? [] : ["CONFIDENCE_SOURCES_INCOMPLETE" as const]),
    ...(RESOLVER_VERSION ? [] : ["CALIBRATION_MODEL_UNAVAILABLE" as const]),
    ...(evidencePkg?.dependency_context.dependency_lineage.length ? [] : ["UNCERTAINTY_ANALYSIS_INCOMPLETE" as const]),
    ...(risks.some((risk) => risk.lineage_refs.length === 0) ? ["HISTORICAL_LINEAGE_MISSING" as const] : []),
    ...(evidencePkg && !validationPass ? ["REPLAY_INCOMPATIBLE" as const] : []),
    ...(crossTenant ? ["CROSS_TENANT_RISK_REFERENCE" as const] : []),
    ...(request.mission_tenant_package?.validation.validation_status === "FAIL" || request.authority_operator_package?.validation.validation_status === "FAIL" ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
  ];
  const unique = Object.freeze([...new Set(failures)]);
  const state: RiskConfidenceResolutionState =
    unique.includes("CROSS_TENANT_RISK_REFERENCE") ? "FAILED_ISOLATION"
      : unique.includes("INTEGRITY_VERIFICATION_FAILED") ? "FAILED_INTEGRITY"
        : unique.some((failure) => failure.includes("CONFIDENCE") || failure.includes("CALIBRATION") || failure.includes("UNCERTAINTY")) ? "FAILED_CONFIDENCE"
          : unique.length ? "FAILED_RISK"
            : "PASSED";
  return Object.freeze({
    validation_status: unique.length ? "FAIL" : "PASS",
    validation_state: state,
    failure_reason: unique[0],
    failure_reasons: unique,
    checks: Object.freeze({
      active_risks_identified: risks.length > 0,
      risk_evidence_available: risks.every((risk) => risk.evidence_refs.length > 0) && evidenceScore > 0,
      severity_reproducible: risks.every((risk) => Boolean(risk.severity)),
      mitigation_status_verified: mitigations.every((mitigation) => mitigation.mitigation_state !== "UNKNOWN"),
      exposure_calculated: risks.every((risk) => Number.isFinite(risk.exposure)),
      confidence_sources_complete: Boolean(evidencePkg?.evidence_context.evidence_lineage.length),
      calibration_deterministic: true,
      uncertainty_documented: Boolean(evidencePkg?.dependency_context.dependency_lineage.length),
      historical_lineage_preserved: risks.every((risk) => risk.lineage_refs.length > 0),
      replay_compatible: !unique.includes("REPLAY_INCOMPATIBLE"),
      tenant_isolated: !crossTenant,
      integrity_verified: !unique.includes("INTEGRITY_VERIFICATION_FAILED"),
    }),
  });
}

function riskContext(request: RiskConfidenceContextRequest, risks: readonly RiskRecord[], mitigations: readonly MitigationStatusRecord[], validation: RiskConfidenceValidationResult): RiskContext {
  const residual = risks.map((risk) => residualRisk(risk, mitigations.find((item) => item.risk_id === risk.risk_id) as MitigationStatusRecord));
  const emerging = risks.filter((risk) => risk.risk_type === "RUNTIME" || risk.risk_type === "FORECAST");
  const mitigated = risks.filter((risk) => mitigations.find((item) => item.risk_id === risk.risk_id)?.mitigation_state === "COMPLETED");
  const exposure = Number((risks.reduce((max, risk) => Math.max(max, risk.exposure), 0)).toFixed(6));
  const severity = severityFor(exposure);
  const base: Omit<RiskContext, "integrity_hash"> = {
    risk_context_id: `risk_context_${request.candidate.candidate_id}`,
    decision_candidate_id: request.candidate.candidate_id,
    active_risks: risks,
    residual_risks: Object.freeze(residual),
    emerging_risks: Object.freeze(emerging),
    mitigated_risks: Object.freeze(mitigated),
    mitigation_status: mitigations,
    risk_severity: severity,
    risk_exposure: exposure,
    operational_impact: severity === "High" || severity === "Critical" ? "operator_review_required" : "advisory_monitoring",
    risk_lineage: Object.freeze(risks.flatMap((risk) => risk.lineage_refs).sort()),
    validation_state: validation.validation_state,
    explainability: riskExplainability({ candidate: request.candidate, risks, mitigations, validation: validation.failure_reasons }),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function confidenceContext(request: RiskConfidenceContextRequest, risk: RiskContext, validation: RiskConfidenceValidationResult): ConfidenceContext {
  const evidenceScore = request.evidence_dependency_package?.evidence_context.evidence_confidence ?? 0;
  const dependencyBlocked = request.evidence_dependency_package?.dependency_context.dependency_status !== "CLEAR";
  const calibrationResult = calibration({ evidenceScore, riskExposure: risk.risk_exposure, validationPass: validation.validation_status === "PASS", dependencyBlocked });
  const uncertainty = uncertaintyAnalysis({ evidenceScore, dependencyBlocked, risks: risk.active_risks });
  const base: Omit<ConfidenceContext, "integrity_hash"> = {
    confidence_context_id: `confidence_context_${request.candidate.candidate_id}`,
    decision_candidate_id: request.candidate.candidate_id,
    confidence_level: confidenceLevel(calibrationResult.calibrated_confidence),
    confidence_sources: Object.freeze(["evidence_quality", "evidence_lineage", "dependency_status", "risk_exposure", "replay_validation"]),
    confidence_calibration: calibrationResult,
    uncertainty_analysis: uncertainty,
    confidence_lineage: Object.freeze([...risk.risk_lineage, ...calibrationResult.calibration_lineage]),
    confidence_history: Object.freeze([`confidence_history_${request.candidate.mission_id}_001`]),
    validation_state: validation.validation_state,
    explainability: confidenceExplainability({ calibration: calibrationResult, uncertainty, candidate: request.candidate, validation: validation.failure_reasons }),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function riskDomain(context: RiskContext, candidate: DecisionCandidate): DecisionContextDomain {
  const base: Omit<DecisionContextDomain, "integrity_hash"> = {
    domain_name: "risk_context",
    required: true,
    status: context.validation_state === "PASSED" ? "COMPLETE" : "UNAVAILABLE",
    source_subsystem: "risk-intelligence",
    originating_record: context.risk_context_id,
    resolver: RESOLVER_VERSION,
    supporting_evidence: Object.freeze(context.active_risks.flatMap((risk) => risk.evidence_refs).sort()),
    confidence: 1 - Math.min(1, context.risk_exposure),
    governance_rationale: `${context.risk_severity} risk severity resolved for ${candidate.candidate_id}.`,
    constitutional_rationale: "Risk transparency and advisory-only operation preserved.",
    replay_reference: `replay_risk_context_${candidate.candidate_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function confidenceDomain(context: ConfidenceContext, candidate: DecisionCandidate): DecisionContextDomain {
  const base: Omit<DecisionContextDomain, "integrity_hash"> = {
    domain_name: "confidence_context",
    required: true,
    status: context.validation_state === "PASSED" ? "COMPLETE" : "UNAVAILABLE",
    source_subsystem: "confidence-intelligence",
    originating_record: context.confidence_context_id,
    resolver: RESOLVER_VERSION,
    supporting_evidence: context.confidence_sources,
    confidence: context.confidence_calibration.calibrated_confidence,
    governance_rationale: `${context.confidence_level} confidence after deterministic calibration.`,
    constitutional_rationale: "No hidden confidence adjustments applied.",
    replay_reference: `replay_confidence_context_${candidate.candidate_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function packageHash(pkg: Omit<RiskConfidenceContextPackage, "integrity_hash"> | RiskConfidenceContextPackage): string {
  const copy = { ...(pkg as RiskConfidenceContextPackage) } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(copy);
}

export function resolveRiskConfidenceContext(request: RiskConfidenceContextRequest = createRiskConfidenceContextRequest()): RiskConfidenceContextPackage {
  const risks = registryRisks(request.candidate);
  const mitigations = Object.freeze(risks.map(mitigationStatus));
  const validation = validationFor(request, risks, mitigations);
  const risk_context = riskContext(request, risks, mitigations, validation);
  const confidence_context = confidenceContext(request, risk_context, validation);
  const base: Omit<RiskConfidenceContextPackage, "integrity_hash"> = {
    resolution_id: request.resolution_id,
    candidate_id: request.candidate.candidate_id,
    risk_context,
    confidence_context,
    risk_domain: riskDomain(risk_context, request.candidate),
    confidence_domain: confidenceDomain(confidence_context, request.candidate),
    validation,
    replay_ref: `replay_risk_confidence_${request.resolution_id}`,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: packageHash(base) });
}

export function replayRiskConfidenceContext(pkg: RiskConfidenceContextPackage): RiskConfidenceReplayResult {
  const reconstructed_hash = packageHash(pkg);
  const replay_valid = reconstructed_hash === pkg.integrity_hash;
  const base: Omit<RiskConfidenceReplayResult, "integrity_hash"> = {
    replay_id: `replay_validation_${pkg.resolution_id}`,
    replay_valid,
    resolution_id: pkg.resolution_id,
    reconstructed_hash,
    expected_hash: pkg.integrity_hash,
    reconstructed_state: pkg.validation.validation_state,
    failures: replay_valid ? Object.freeze([]) : Object.freeze(["INTEGRITY_VERIFICATION_FAILED"] as const),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function buildRiskConfidenceObservability(packages: readonly RiskConfidenceContextPackage[]): RiskConfidenceObservability {
  const failures = packages.flatMap((pkg) => pkg.validation.failure_reasons);
  return Object.freeze({
    resolution_attempts: packages.length,
    successful_resolutions: packages.filter((pkg) => pkg.validation.validation_status === "PASS").length,
    failed_resolutions: packages.filter((pkg) => pkg.validation.validation_status === "FAIL").length,
    risk_failures: failures.filter((failure) => failure.includes("RISK") || failure.includes("SEVERITY") || failure.includes("MITIGATION") || failure.includes("EXPOSURE")).length,
    confidence_failures: failures.filter((failure) => failure.includes("CONFIDENCE") || failure.includes("CALIBRATION") || failure.includes("UNCERTAINTY")).length,
    isolation_failures: failures.filter((failure) => failure === "CROSS_TENANT_RISK_REFERENCE").length,
    integrity_failures: failures.filter((failure) => failure === "INTEGRITY_VERIFICATION_FAILED").length,
    average_risk_exposure: packages.length === 0 ? 0 : packages.reduce((sum, pkg) => sum + pkg.risk_context.risk_exposure, 0) / packages.length,
    average_calibrated_confidence: packages.length === 0 ? 0 : packages.reduce((sum, pkg) => sum + pkg.confidence_context.confidence_calibration.calibrated_confidence, 0) / packages.length,
    replay_success_rate: packages.length === 0 ? 0 : packages.filter((pkg) => replayRiskConfidenceContext(pkg).replay_valid).length / packages.length,
  });
}

export function getRiskConfidenceContextResolver() {
  const request = createRiskConfidenceContextRequest();
  const context_package = resolveRiskConfidenceContext(request);
  return Object.freeze({
    resolution_order: RESOLUTION_ORDER,
    risk_registry: RISK_REGISTRY,
    request,
    context_package,
    replay: replayRiskConfidenceContext(context_package),
    observability: buildRiskConfidenceObservability([context_package]),
  });
}
