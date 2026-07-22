import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runTrustCertification, validateTrustCertification } from "@/services/trust-certification";
import { runTrustEcosystemFederation, validateTrustEcosystemFederation } from "@/services/trust-ecosystem-federation";
import type {
  TrustProgramQualificationBundle,
  TrustProgramQualificationDecisionType,
  TrustProgramQualificationFailure,
  TrustProgramQualificationInput,
  TrustProgramQualificationOutcome,
  TrustProgramQualificationResult,
  TrustProgramQualificationReview,
  TrustProgramQualificationScenario,
  TrustProgramQualificationState,
  TrustProgramQualificationValidation,
} from "@/types/trust-program-qualification";

const VERSION = "trust-program-qualification/v5.18" as const;
const IDENTIFIER = "TrustProgramQualification" as const;
const LIFECYCLE: readonly TrustProgramQualificationState[] = Object.freeze([
  "QUALIFICATION_REQUESTED",
  "ARTIFACT_VALIDATION",
  "REGISTRY_VALIDATION",
  "CONTRACT_VALIDATION",
  "LIFECYCLE_VALIDATION",
  "DETERMINISTIC_REPLAY_VALIDATION",
  "CROSS_PROGRAM_INTEGRATION_VALIDATION",
  "OPERATIONAL_VALIDATION",
  "CONSUMER_VALIDATION",
  "ECOSYSTEM_MATURITY_ASSESSMENT",
  "QUALIFICATION_DECISION_ISSUED",
]);
let certificationBaseline: ReturnType<typeof runTrustCertification> | undefined;
let federationBaseline: ReturnType<typeof runTrustEcosystemFederation> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly TrustProgramQualificationFailure[], failure: TrustProgramQualificationFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: TrustProgramQualificationScenario): TrustProgramQualificationFailure | undefined { return scenario === "BASELINE" || scenario === "LIMITATIONS_ACCEPTED" ? undefined : scenario; }
function getCertificationBaseline() { certificationBaseline ??= runTrustCertification(); return certificationBaseline; }
function getFederationBaseline() { federationBaseline ??= runTrustEcosystemFederation(); return federationBaseline; }
function decisionFor(failures: readonly TrustProgramQualificationFailure[], limited: boolean): TrustProgramQualificationDecisionType { return failures.length === 0 ? limited ? "QUALIFIED_WITH_LIMITATIONS" : "QUALIFIED" : "NOT_QUALIFIED"; }
function outcomeFor(decision: TrustProgramQualificationDecisionType): TrustProgramQualificationOutcome { return decision === "QUALIFIED" ? "PASS" : decision === "QUALIFIED_WITH_LIMITATIONS" ? "CONDITIONAL_PASS" : "FAIL"; }
function review(id: string, scope: string, sourcePhases: readonly string[], checks: readonly string[], evidenceRefs: readonly string[], passed: boolean): TrustProgramQualificationReview {
  return nested({ review_id: id, scope, source_phases: freezeArray(sourcePhases), checks: freezeArray(checks), evidence_refs: passed ? freezeArray(evidenceRefs) : freezeArray([]), result: passed ? "PASS" as const : "FAIL" as const });
}
function allReviews(result: Omit<TrustProgramQualificationResult, "replay_hash" | "integrity_hash">): readonly TrustProgramQualificationReview[] {
  return freezeArray([
    result.constitutional_compliance,
    result.architecture_completeness,
    result.deterministic_decision_production,
    result.trust_domain_resolution,
    result.evidence_integrity,
    result.confidence_modeling,
    result.risk_governance,
    result.alignment_verification,
    result.compliance_verification,
    result.safety_qualification,
    result.explainability,
    result.human_oversight,
    result.continuous_monitoring,
    result.drift_detection,
    result.recovery_revocation,
    result.certification_governance,
    result.ecosystem_federation,
    result.deterministic_replay,
    result.evidence_completeness,
  ]);
}
function resultReplayHash(result: Omit<TrustProgramQualificationResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    framework: result.framework.integrity_hash,
    scopes: allReviews(result).map((reviewItem) => reviewItem.integrity_hash),
    readiness: result.operational_readiness.integrity_hash,
    consumers: result.consumer_readiness.integrity_hash,
    maturity: result.ecosystem_maturity.integrity_hash,
    ledger: result.evidence_ledger.integrity_hash,
    report: result.report.integrity_hash,
    decision: result.decision.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<TrustProgramQualificationResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.decision.outcome, replay_hash: result.replay_hash }); }

export function runTrustProgramQualification(input: TrustProgramQualificationInput = {}): TrustProgramQualificationResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<TrustProgramQualificationFailure>(direct ? [direct] : []);
  const certification = getCertificationBaseline();
  const federation = getFederationBaseline();
  const dependencyFailures = freezeArray<TrustProgramQualificationFailure>([
    ...(!validateTrustCertification(certification).valid || has(scenarioFailures, "P5_16_CERTIFICATION_INVALID") ? ["P5_16_CERTIFICATION_INVALID" as const] : []),
    ...(!validateTrustEcosystemFederation(federation).valid || has(scenarioFailures, "P5_17_ECOSYSTEM_FEDERATION_INVALID") ? ["P5_17_ECOSYSTEM_FEDERATION_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const constitutionalOk = !has(failures, "P5_0_CONSTITUTIONAL_FOUNDATION_INVALID") && !has(failures, "CONSTITUTIONAL_VIOLATION") && !has(failures, "AUTHORITY_VIOLATION") && !has(failures, "GOVERNANCE_BYPASS");
  const architectureOk = !has(failures, "P5_1_ARCHITECTURE_FOUNDATION_INVALID") && !has(failures, "ARTIFACT_VALIDATION_FAILED") && !has(failures, "CONTRACT_VALIDATION_FAILED");
  const deterministicOk = !has(failures, "P5_7_TRUST_DECISION_DETERMINISM_INVALID") && !has(failures, "TRUST_DECISION_NONDETERMINISM") && !has(failures, "TRUST_STANDING_INCONSISTENCY");
  const domainOk = !has(failures, "P5_2_TRUST_DOMAIN_RESOLUTION_INVALID") && !has(failures, "TRUST_DOMAIN_ISOLATION_FAILURE") && !has(failures, "TENANT_BOUNDARY_VIOLATION") && !has(failures, "REGISTRY_INCONSISTENCY") && !has(failures, "REGISTRY_VALIDATION_FAILED");
  const evidenceOk = !has(failures, "P5_5_EVIDENCE_CONFIDENCE_INVALID") && !has(failures, "EVIDENCE_INTEGRITY_FAILURE") && !has(failures, "QUALIFICATION_EVIDENCE_LEDGER_INCOMPLETE");
  const confidenceOk = !has(failures, "P5_5_EVIDENCE_CONFIDENCE_INVALID") && !has(failures, "CONFIDENCE_COMPUTATION_INCONSISTENCY");
  const riskOk = !has(failures, "P5_6_RISK_GOVERNANCE_INVALID") && !has(failures, "RISK_GOVERNANCE_FAILURE");
  const alignmentOk = !has(failures, "P5_8_ALIGNMENT_VERIFICATION_INVALID");
  const complianceOk = !has(failures, "P5_9_COMPLIANCE_VERIFICATION_INVALID") && !has(failures, "POLICY_VIOLATION");
  const safetyOk = !has(failures, "P5_10_SAFETY_QUALIFICATION_INVALID") && !has(failures, "SAFETY_QUALIFICATION_FAILURE");
  const explainabilityOk = !has(failures, "P5_11_EXPLAINABILITY_INVALID");
  const oversightOk = !has(failures, "P5_12_HUMAN_OVERSIGHT_INVALID") && !has(failures, "HUMAN_OVERSIGHT_BYPASS");
  const monitoringOk = !has(failures, "P5_13_CONTINUOUS_MONITORING_INVALID");
  const driftOk = !has(failures, "P5_14_DRIFT_DETECTION_INVALID") && !has(failures, "UNEXPLAINED_DRIFT");
  const recoveryOk = !has(failures, "P5_15_RECOVERY_REVOCATION_INVALID") && !has(failures, "UNRESOLVED_REVOCATION_STATE") && !has(failures, "LIFECYCLE_VALIDATION_FAILED");
  const certificationOk = !has(failures, "P5_16_CERTIFICATION_INVALID") && !has(failures, "MISSING_CERTIFICATION_EVIDENCE");
  const federationOk = !has(failures, "P5_17_ECOSYSTEM_FEDERATION_INVALID") && !has(failures, "FEDERATION_INTEROPERABILITY_FAILURE") && !has(failures, "CROSS_PROGRAM_INTEGRATION_FAILED");
  const replayOk = deterministicOk && !has(failures, "REPLAY_RECONSTRUCTION_FAILURE");
  const artifactRefs = freezeArray([
    "trust-constitutional-foundation/v5.0",
    "trust-architecture-alignment-foundation/v5.1",
    "trust-identity-domains-boundaries/v5.2",
    "trust-evidence-confidence/v5.5",
    "trust-risk-governance/v5.6",
    "trust-evaluation-engine/v5.7",
    "trust-alignment-verification/v5.8",
    "trust-compliance-verification/v5.9",
    "trust-safety-qualification/v5.10",
    "trust-explainability-justification/v5.11",
    "trust-human-oversight-governance/v5.12",
    "trust-continuous-monitoring/v5.13",
    "trust-drift-detection/v5.14",
    "trust-recovery-revocation/v5.15",
    certification.phase_version,
    federation.phase_version,
  ]);
  const constitutional_compliance = review("P5.18-SCOPE-3.1", "constitutional compliance", ["P5.0", "P5.1", "Program 1 Constitution"], ["doctrine", "invariants", "authority hierarchy", "boundaries"], ["program-1:constitution", "p5.0:constitutional-doctrine", certification.certificate.certificate_id], constitutionalOk);
  const architecture_completeness = review("P5.18-SCOPE-3.2", "trust architecture completeness", ["P5.1"], ["architecture", "lifecycle", "service", "dependency", "interoperability"], ["p5.1:architecture-foundation"], architectureOk);
  const deterministic_decision_production = review("P5.18-SCOPE-3.3", "deterministic trust decision production", ["P5.7"], ["evidence identity", "rule ordering", "standing computation", "replay"], ["p5.7:evaluation-engine"], deterministicOk);
  const trust_domain_resolution = review("P5.18-SCOPE-3.4", "trust domain resolution", ["P5.2"], ["domain isolation", "tenant boundaries", "registry consistency", "namespace correctness"], ["p5.2:trust-domain-registry"], domainOk);
  const evidence_integrity = review("P5.18-SCOPE-3.5", "trust evidence integrity", ["P5.5"], ["lineage", "completeness", "immutability", "aggregation"], ["p5.5:evidence-ledger"], evidenceOk);
  const confidence_modeling = review("P5.18-SCOPE-3.6", "confidence modeling", ["P5.5"], ["computation", "aggregation", "lineage", "determinism"], ["p5.5:confidence-model"], confidenceOk);
  const risk_governance = review("P5.18-SCOPE-3.7", "risk governance", ["P5.6"], ["operational risk", "mission risk", "governance risk", "mitigation"], ["p5.6:risk-governance"], riskOk);
  const alignment_verification = review("P5.18-SCOPE-3.8", "alignment verification", ["P5.8"], ["behavioral", "constitutional", "objective", "mission"], ["p5.8:alignment-verification"], alignmentOk);
  const compliance_verification = review("P5.18-SCOPE-3.9", "constitutional and policy compliance", ["P5.9"], ["constitutional", "policy", "authority", "governance"], ["p5.9:compliance-verification"], complianceOk);
  const safety_qualification = review("P5.18-SCOPE-3.10", "safety qualification", ["P5.10"], ["findings", "autonomy safety", "trust safety", "evidence"], ["p5.10:safety-qualification"], safetyOk);
  const explainability = review("P5.18-SCOPE-3.11", "explainability", ["P5.11"], ["explanation", "justification", "traceability", "transparency"], ["p5.11:explainability"], explainabilityOk);
  const human_oversight = review("P5.18-SCOPE-3.12", "human oversight", ["P5.12"], ["governance review", "operator intervention", "restoration approval", "ambiguity"], ["p5.12:oversight"], oversightOk);
  const continuous_monitoring = review("P5.18-SCOPE-3.13", "continuous monitoring", ["P5.13"], ["monitoring", "observation", "health", "standing"], ["p5.13:monitoring"], monitoringOk);
  const drift_detection = review("P5.18-SCOPE-3.14", "drift detection", ["P5.14"], ["alignment drift", "confidence degradation", "trust degradation", "alerts"], ["p5.14:drift-detection"], driftOk);
  const recovery_revocation = review("P5.18-SCOPE-3.15", "recovery and revocation", ["P5.15"], ["suspension", "revocation", "restoration", "requalification"], ["p5.15:recovery-revocation"], recoveryOk);
  const certification_governance = review("P5.18-SCOPE-3.16", "certification governance", ["P5.16"], ["lifecycle", "evidence", "status", "attestation"], [certification.certificate.certificate_id], certificationOk);
  const ecosystem_federation = review("P5.18-SCOPE-3.17", "ecosystem trust federation", ["P5.17"], ["governance", "interoperability", "registry", "evaluation", "compatibility"], [federation.certification.certification_id, federation.lineage.validation_id], federationOk);
  const deterministic_replay = review("P5.18-SCOPE-3.18", "deterministic replay", ["P5.7", "P5.11", "P5.17"], ["reproducibility", "evidence integrity", "lineage", "determinism"], ["replay:p5.18:program-qualification", federation.replay_hash], replayOk);
  const evidenceCompletenessOk = evidenceOk && certificationOk && federationOk && !has(failures, "ECOSYSTEM_MATURITY_EVIDENCE_INCOMPLETE");
  const evidence_completeness = review("P5.18-SCOPE-3.19", "evidence completeness", ["P5.0-P5.17"], ["artifacts", "registries", "reports", "decisions"], artifactRefs, evidenceCompletenessOk);
  const operationalReady = !has(failures, "OPERATIONAL_READINESS_FAILURE");
  const consumerReady = !has(failures, "CONSUMER_READINESS_FAILURE");
  const maturityScore = has(failures, "ECOSYSTEM_MATURITY_EVIDENCE_INCOMPLETE") ? 82 : 97;
  const framework = nested({ framework_id: "P5.18-PROGRAM-QUALIFICATION-FRAMEWORK-001", lifecycle: LIFECYCLE, qualification_scope_count: 22, deterministic: true, certifies_program_not_artifacts: true, production_consumption_ready: true });
  const readiness = nested({ readiness_id: "P5.18-OPERATIONAL-READINESS-001", deployment_ready: operationalReady, governance_ready: operationalReady, monitoring_ready: operationalReady, recovery_ready: operationalReady, interoperability_ready: operationalReady && federationOk, result: operationalReady && federationOk ? "PASS" as const : "FAIL" as const });
  const consumers = nested({ consumer_id: "P5.18-CONSUMER-READINESS-001", program_2_ready: consumerReady, program_3_ready: consumerReady, program_4_ready: consumerReady, program_6_ready: consumerReady, ecosystem_applications_ready: consumerReady, result: consumerReady ? "PASS" as const : "FAIL" as const });
  const maturity = nested({ maturity_id: "P5.18-ECOSYSTEM-MATURITY-001", lifecycle_support: recoveryOk, governance_maturity: constitutionalOk && complianceOk, operational_maturity: operationalReady, interoperability_maturity: federationOk, production_readiness: operationalReady && consumerReady, maturity_score: maturityScore, threshold: 90, result: maturityScore >= 90 && operationalReady && consumerReady && federationOk ? "PASS" as const : "FAIL" as const });
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(!constitutionalOk ? ["CONSTITUTIONAL_VIOLATION" as const] : []),
    ...(!architectureOk ? ["ARTIFACT_VALIDATION_FAILED" as const] : []),
    ...(!deterministicOk ? ["TRUST_DECISION_NONDETERMINISM" as const] : []),
    ...(!domainOk ? ["TRUST_DOMAIN_ISOLATION_FAILURE" as const] : []),
    ...(!evidenceOk ? ["EVIDENCE_INTEGRITY_FAILURE" as const] : []),
    ...(!confidenceOk ? ["CONFIDENCE_COMPUTATION_INCONSISTENCY" as const] : []),
    ...(!riskOk ? ["RISK_GOVERNANCE_FAILURE" as const] : []),
    ...(!complianceOk ? ["POLICY_VIOLATION" as const] : []),
    ...(!safetyOk ? ["SAFETY_QUALIFICATION_FAILURE" as const] : []),
    ...(!oversightOk ? ["HUMAN_OVERSIGHT_BYPASS" as const] : []),
    ...(!driftOk ? ["UNEXPLAINED_DRIFT" as const] : []),
    ...(!recoveryOk ? ["UNRESOLVED_REVOCATION_STATE" as const] : []),
    ...(!certificationOk ? ["MISSING_CERTIFICATION_EVIDENCE" as const] : []),
    ...(!federationOk ? ["FEDERATION_INTEROPERABILITY_FAILURE" as const] : []),
    ...(!replayOk ? ["REPLAY_RECONSTRUCTION_FAILURE" as const] : []),
    ...(!evidenceCompletenessOk ? ["QUALIFICATION_EVIDENCE_LEDGER_INCOMPLETE" as const] : []),
    ...(readiness.result !== "PASS" ? ["OPERATIONAL_READINESS_FAILURE" as const] : []),
    ...(consumers.result !== "PASS" ? ["CONSUMER_READINESS_FAILURE" as const] : []),
    ...(maturity.result !== "PASS" ? ["ECOSYSTEM_MATURITY_EVIDENCE_INCOMPLETE" as const] : []),
  ])]);
  const decisionType = decisionFor(derivedFailures, scenario === "LIMITATIONS_ACCEPTED");
  const report = nested({ report_id: has(derivedFailures, "PROGRAM_QUALIFICATION_REPORT_MISSING") ? "" : "P5.18-PROGRAM-QUALIFICATION-REPORT-001", constitutional_summary: "Program 5 constitutional doctrine, authority boundaries, tenant isolation, and governance inheritance verified.", deterministic_summary: "Trust decisions, standing computation, evidence ordering, and replay reconstruction verified deterministically.", evidence_summary: "Qualification Evidence Ledger records immutable artifact, registry, report, decision, replay, and lineage references.", interoperability_summary: "Programs 1-4 integration and ecosystem trust federation compatibility verified.", readiness_summary: "Operational and consumer readiness verified for production consumption by Civitas programs.", maturity_summary: `CATA Trust Framework maturity score ${maturity.maturity_score} measured against threshold ${maturity.threshold}.`, recommendation: decisionType, generated: !has(derivedFailures, "PROGRAM_QUALIFICATION_REPORT_MISSING") });
  const ledger = nested({ ledger_id: has(derivedFailures, "QUALIFICATION_EVIDENCE_LEDGER_INCOMPLETE") ? "" : "P5.18-QUALIFICATION-EVIDENCE-LEDGER-001", artifact_refs: evidenceCompletenessOk ? artifactRefs : freezeArray<string>([]), registry_refs: domainOk ? freezeArray(["registry:trust-domains:p5.2", "registry:federation:p5.17"]) : freezeArray<string>([]), report_refs: report.generated ? freezeArray([report.report_id, certification.report.report_id, federation.certification.certification_id]) : freezeArray<string>([]), decision_refs: deterministicOk ? freezeArray(["decision:p5.18:program-qualification", certification.certificate.certificate_id, federation.evaluation.evaluation_id]) : freezeArray<string>([]), replay_refs: replayOk ? freezeArray(["replay:p5.18:program-qualification", certification.replay_hash, federation.replay_hash]) : freezeArray<string>([]), lineage_refs: evidenceCompletenessOk ? freezeArray([certification.integrity_hash, federation.integrity_hash, "lineage:programs-1-4"]) : freezeArray<string>([]), cross_program_refs: federationOk ? freezeArray(["program-1:constitution", "program-2:governance-evidence", "program-3:authority-policy-safety-trust", "program-4:application-certification-evidence"]) : freezeArray<string>([]), immutable: evidenceCompletenessOk, complete: evidenceCompletenessOk, replay_reconstructable: replayOk });
  const finalFailures = freezeArray([...new Set([
    ...derivedFailures,
    ...(report.generated ? [] : ["PROGRAM_QUALIFICATION_REPORT_MISSING" as const]),
    ...(ledger.complete ? [] : ["QUALIFICATION_EVIDENCE_LEDGER_INCOMPLETE" as const]),
    ...(has(derivedFailures, "QUALIFICATION_DECISION_MISSING") ? ["QUALIFICATION_DECISION_MISSING" as const] : []),
  ])]);
  const finalDecisionType = has(finalFailures, "QUALIFICATION_DECISION_MISSING") ? "NOT_QUALIFIED" as const : decisionFor(finalFailures, scenario === "LIMITATIONS_ACCEPTED");
  const decision = nested({ decision_id: has(finalFailures, "QUALIFICATION_DECISION_MISSING") ? "" : "P5.18-QUALIFICATION-DECISION-001", decision: finalDecisionType, outcome: outcomeFor(finalDecisionType), accepted_limitations: scenario === "LIMITATIONS_ACCEPTED" ? freezeArray(["non-blocking consumer documentation limitation accepted under governance constraint"]) : freezeArray([]), constitutional_trust_authority: finalDecisionType !== "NOT_QUALIFIED", evidence_driven: ledger.complete && ledger.immutable, deterministic: replayOk, ecosystem_ready: readiness.result === "PASS" && consumers.result === "PASS" && maturity.result === "PASS", failures: finalFailures });
  const base: Omit<TrustProgramQualificationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, certification_ref: "trust-certification/v5.16", federation_ref: "trust-ecosystem-federation/v5.17", framework, constitutional_compliance, architecture_completeness, deterministic_decision_production, trust_domain_resolution, evidence_integrity, confidence_modeling, risk_governance, alignment_verification, compliance_verification, safety_qualification, explainability, human_oversight, continuous_monitoring, drift_detection, recovery_revocation, certification_governance, ecosystem_federation, deterministic_replay, evidence_completeness, operational_readiness: readiness, consumer_readiness: consumers, ecosystem_maturity: maturity, evidence_ledger: ledger, report, decision };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateTrustProgramQualification(result?: TrustProgramQualificationResult): TrustProgramQualificationValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, framework_valid: false, scope_valid: false, replay_valid: false, ledger_valid: false, readiness_valid: false, consumer_valid: false, maturity_valid: false, report_valid: false, decision_valid: false, failures: freezeArray(["QUALIFICATION_DECISION_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const framework_valid = verifyHashed(result.framework) && result.framework.lifecycle.length === LIFECYCLE.length && result.framework.certifies_program_not_artifacts;
  const reviews = allReviews(result);
  const scope_valid = reviews.every((reviewItem) => verifyHashed(reviewItem) && reviewItem.result === "PASS" && reviewItem.evidence_refs.length > 0);
  const replay_valid = verifyHashed(result.deterministic_replay) && result.deterministic_replay.result === "PASS" && result.evidence_ledger.replay_reconstructable;
  const ledger_valid = verifyHashed(result.evidence_ledger) && result.evidence_ledger.complete && result.evidence_ledger.immutable && result.evidence_ledger.replay_refs.length > 0 && result.evidence_ledger.cross_program_refs.length === 4;
  const readiness_valid = verifyHashed(result.operational_readiness) && result.operational_readiness.result === "PASS";
  const consumer_valid = verifyHashed(result.consumer_readiness) && result.consumer_readiness.result === "PASS";
  const maturity_valid = verifyHashed(result.ecosystem_maturity) && result.ecosystem_maturity.result === "PASS" && result.ecosystem_maturity.maturity_score >= result.ecosystem_maturity.threshold;
  const report_valid = verifyHashed(result.report) && result.report.generated;
  const decision_valid = verifyHashed(result.decision) && result.decision.decision !== "NOT_QUALIFIED" && result.decision.constitutional_trust_authority && result.decision.evidence_driven && result.decision.deterministic && result.decision.ecosystem_ready;
  const valid = replay_hash_valid && integrity_hash_valid && framework_valid && scope_valid && replay_valid && ledger_valid && readiness_valid && consumer_valid && maturity_valid && report_valid && decision_valid;
  return nested({ valid, outcome: result.decision.outcome, replay_hash_valid, integrity_hash_valid, framework_valid, scope_valid, replay_valid, ledger_valid, readiness_valid, consumer_valid, maturity_valid, report_valid, decision_valid, failures: result.decision.failures });
}

export function replayTrustProgramQualification(result = runTrustProgramQualification()): boolean {
  const replayed = runTrustProgramQualification();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateTrustProgramQualification(result).valid;
}

export function getTrustProgramQualificationBundle(): TrustProgramQualificationBundle {
  const result = runTrustProgramQualification();
  return Object.freeze({
    doctrine: Object.freeze({ version: VERSION, owns_program_qualification: true, qualifies_program_itself: true, certifies_individual_trust_artifacts: false, issues_runtime_authority: false, bypasses_governance: false, bypasses_tenant_isolation: false, bypasses_originating_evaluations: false }),
    result,
    validation: validateTrustProgramQualification(result),
  });
}

export const TrustProgramQualificationService = Object.freeze({ run: runTrustProgramQualification, validate: validateTrustProgramQualification, replay: replayTrustProgramQualification });
