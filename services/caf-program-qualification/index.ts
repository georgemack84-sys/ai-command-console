import { runBehavioralReplayDivergence, validateBehavioralReplayDivergence } from "@/services/caf-behavioral-replay-divergence";
import { runConsumerAdoptionMigration, validateConsumerAdoptionMigration } from "@/services/caf-consumer-adoption-migration";
import { runOperationsIncidentGovernance, validateOperationsIncidentGovernance } from "@/services/caf-operations-incident-governance";
import { runPlatformAssurance, validatePlatformAssurance } from "@/services/caf-platform-assurance";
import { runPlatformCertification, validatePlatformCertification } from "@/services/caf-platform-certification";
import { runSdkInterfaceQualification, validateSdkInterfaceQualification } from "@/services/caf-sdk-interface-qualification";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  ProgramQualificationBundle,
  ProgramQualificationDecisionType,
  ProgramQualificationFailure,
  ProgramQualificationInput,
  ProgramQualificationOutcome,
  ProgramQualificationResult,
  ProgramQualificationScenario,
  ProgramQualificationState,
  ProgramQualificationValidation,
  QualificationReview,
} from "@/types/caf-program-qualification";

const VERSION = "caf-program-qualification/v3.18" as const;
const IDENTIFIER = "CafProgramQualification" as const;
const LIFECYCLE: readonly ProgramQualificationState[] = Object.freeze([
  "QUALIFICATION_REQUESTED",
  "DEPENDENCY_VALIDATION",
  "CONSTITUTION_REVIEW",
  "ARCHITECTURE_REVIEW",
  "GOVERNANCE_REVIEW",
  "AUTHORITY_REVIEW",
  "POLICY_REVIEW",
  "SAFETY_REVIEW",
  "REPLAY_REVIEW",
  "EVIDENCE_REVIEW",
  "OPERATIONAL_READINESS",
  "CONSUMER_READINESS",
  "PLATFORM_MATURITY_ASSESSMENT",
  "QUALIFICATION_DECISION",
  "SUBMITTED_TO_P3_15_CERTIFICATION",
]);
let baselineReplay: ReturnType<typeof runBehavioralReplayDivergence> | undefined;
let baselineOperations: ReturnType<typeof runOperationsIncidentGovernance> | undefined;
let baselineAssurance: ReturnType<typeof runPlatformAssurance> | undefined;
let baselineCertification: ReturnType<typeof runPlatformCertification> | undefined;
let baselineSdk: ReturnType<typeof runSdkInterfaceQualification> | undefined;
let baselineMigration: ReturnType<typeof runConsumerAdoptionMigration> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}
function nested<T extends object>(value: T): T & { integrity_hash: string } {
  return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string };
}
function has(failures: readonly ProgramQualificationFailure[], failure: ProgramQualificationFailure): boolean { return failures.includes(failure); }
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function getBaselineReplay() { baselineReplay ??= runBehavioralReplayDivergence(); return baselineReplay; }
function getBaselineOperations() { baselineOperations ??= runOperationsIncidentGovernance(); return baselineOperations; }
function getBaselineAssurance() { baselineAssurance ??= runPlatformAssurance(); return baselineAssurance; }
function getBaselineCertification() { baselineCertification ??= runPlatformCertification(); return baselineCertification; }
function getBaselineSdk() { baselineSdk ??= runSdkInterfaceQualification(); return baselineSdk; }
function getBaselineMigration() { baselineMigration ??= runConsumerAdoptionMigration(); return baselineMigration; }
function scenarioFailure(scenario: ProgramQualificationScenario): ProgramQualificationFailure | undefined {
  return scenario === "BASELINE" || scenario === "CONDITIONAL_DEFICIENCIES_ACCEPTED" ? undefined : scenario;
}
function decisionFor(failures: readonly ProgramQualificationFailure[], conditional: boolean): ProgramQualificationDecisionType {
  if (failures.length === 0) return conditional ? "CONDITIONALLY_QUALIFIED" : "QUALIFIED";
  return "NOT_QUALIFIED";
}
function outcomeFor(decision: ProgramQualificationDecisionType, failures: readonly ProgramQualificationFailure[]): ProgramQualificationOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  if (decision === "CONDITIONALLY_QUALIFIED") return "CONDITIONAL_PASS";
  return decision === "QUALIFIED" ? "PASS" : "FAIL";
}
function review(id: string, scope: string, checks: readonly string[], evidenceRefs: readonly string[], passed: boolean): QualificationReview {
  return nested({
    review_id: id,
    scope,
    checks: freezeArray(checks),
    evidence_refs: passed ? freezeArray(evidenceRefs) : freezeArray([]),
    result: passed ? "PASS" as const : "FAIL" as const,
  });
}

function resultReplayHash(result: Omit<ProgramQualificationResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    framework: result.framework.integrity_hash,
    constitutional: result.constitutional_review.integrity_hash,
    architecture: result.architecture_review.integrity_hash,
    governance: result.governance_review.integrity_hash,
    authority: result.authority_review.integrity_hash,
    policy: result.policy_review.integrity_hash,
    safety: result.safety_review.integrity_hash,
    replay: result.replay_review.integrity_hash,
    evidence: result.evidence_review.integrity_hash,
    interoperability: result.interoperability_review.integrity_hash,
    readiness: result.readiness.integrity_hash,
    maturity: result.maturity.integrity_hash,
    ledger: result.evidence_ledger.integrity_hash,
    report: result.report.integrity_hash,
    decision: result.decision.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<ProgramQualificationResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.decision.outcome, replay_hash: result.replay_hash });
}

export function runProgramQualification(input: ProgramQualificationInput = {}): ProgramQualificationResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<ProgramQualificationFailure>(direct ? [direct] : []);
  const replay = getBaselineReplay();
  const operations = getBaselineOperations();
  const assurance = getBaselineAssurance();
  const certification = getBaselineCertification();
  const sdk = getBaselineSdk();
  const migration = getBaselineMigration();
  const dependencyFailures = freezeArray<ProgramQualificationFailure>([
    ...(!validateBehavioralReplayDivergence(replay).valid || has(scenarioFailures, "P3_11_REPLAY_EVIDENCE_INVALID") ? ["P3_11_REPLAY_EVIDENCE_INVALID" as const] : []),
    ...(!validateOperationsIncidentGovernance(operations).valid || has(scenarioFailures, "P3_13_OPERATIONAL_EVIDENCE_INVALID") ? ["P3_13_OPERATIONAL_EVIDENCE_INVALID" as const] : []),
    ...(!validatePlatformAssurance(assurance).valid || has(scenarioFailures, "P3_14_ASSURANCE_REPORT_INVALID") ? ["P3_14_ASSURANCE_REPORT_INVALID" as const] : []),
    ...(!validatePlatformCertification(certification).valid || has(scenarioFailures, "P3_15_CERTIFICATION_REQUIREMENTS_INVALID") ? ["P3_15_CERTIFICATION_REQUIREMENTS_INVALID" as const] : []),
    ...(!validateSdkInterfaceQualification(sdk).valid || has(scenarioFailures, "P3_16_INTERFACE_QUALIFICATION_INVALID") ? ["P3_16_INTERFACE_QUALIFICATION_INVALID" as const] : []),
    ...(!validateConsumerAdoptionMigration(migration).valid || has(scenarioFailures, "P3_17_MIGRATION_READINESS_INVALID") ? ["P3_17_MIGRATION_READINESS_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const constitutionalOk = !has(failures, "CONSTITUTIONAL_COMPLIANCE_FAILED") && !has(failures, "CCI_CONSTITUTIONAL_CONTRACTS_INVALID");
  const architectureOk = !has(failures, "ARCHITECTURE_INCOMPLETE");
  const governanceOk = !has(failures, "GOVERNANCE_IMPLEMENTATION_FAILED");
  const authorityOk = !has(failures, "AUTHORITY_ENFORCEMENT_FAILED");
  const policyOk = !has(failures, "POLICY_ENFORCEMENT_FAILED");
  const safetyOk = !has(failures, "SAFETY_ENFORCEMENT_FAILED");
  const replayOk = !has(failures, "REPLAY_EVIDENCE_NOT_CONSUMED") && !has(failures, "REPLAY_EXECUTION_ATTEMPTED");
  const evidenceOk = !has(failures, "EVIDENCE_INCOMPLETE") && !has(failures, "EVIDENCE_MUTABLE") && !has(failures, "EVIDENCE_LINEAGE_INCOMPLETE");
  const interoperabilityOk = !has(failures, "INTEROPERABILITY_FAILED");
  const operationalReady = !has(failures, "OPERATIONAL_READINESS_FAILED");
  const consumerReady = !has(failures, "CONSUMER_READINESS_FAILED");
  const maturityScore = has(failures, "MATURITY_THRESHOLD_NOT_MET") ? 78 : 96;
  const framework = nested({
    framework_id: "P3.18-QUALIFICATION-FRAMEWORK-001",
    lifecycle: LIFECYCLE,
    dependency_refs: freezeArray([replay.phase_version, operations.phase_version, assurance.phase_version, certification.phase_version, sdk.phase_version, migration.phase_version, "cci:constitutional-contracts"]),
    evaluation_schedule: freezeArray(["dependency-validation", "constitutional-review", "architecture-review", "governance-review", "readiness-review", "decision"]),
    certification_submission_target: "P3.15 Platform Certification" as const,
    deterministic: true,
  });
  const constitutional_review = review("P3.18-CONSTITUTION-001", "constitutional compliance", ["rules", "dependencies", "contracts", "evidence"], [assurance.qualification_evidence.qualification_evidence_id, "cci:constitutional-contracts"], constitutionalOk);
  const architecture_review = review("P3.18-ARCHITECTURE-001", "architecture completeness", ["modules", "dependencies", "interfaces", "contracts"], [assurance.dependency_report.report_id, sdk.api_validation.report_id], architectureOk);
  const governance_review = review("P3.18-GOVERNANCE-001", "governance implementation", ["hierarchy", "approvals", "evidence", "enforcement"], [assurance.governance_report.report_id, certification.decision.decision_id], governanceOk);
  const authority_review = review("P3.18-AUTHORITY-001", "authority enforcement", ["authority-gate", "approval-enforcement", "escalation", "authority-evidence"], [certification.decision.decision_id], authorityOk);
  const policy_review = review("P3.18-POLICY-001", "policy enforcement", ["policy-evaluation", "decisions", "enforcement", "lineage"], [assurance.governance_report.report_id], policyOk);
  const safety_review = review("P3.18-SAFETY-001", "safety enforcement", ["constraints", "interventions", "containment", "behavioral-safety"], [assurance.governance_report.report_id], safetyOk);
  const replay_review = review("P3.18-REPLAY-001", "replay evidence review", ["consume-p3.11", "consume-p3.14", "determinism", "divergence-review"], [replay.replay_evidence.evidence_id, assurance.replay_findings.findings_id], replayOk);
  const evidence_review = review("P3.18-EVIDENCE-001", "qualification evidence", ["completeness", "integrity", "lineage", "audit"], [assurance.evidence_report.report_id, assurance.qualification_evidence.qualification_evidence_id], evidenceOk);
  const interoperability_review = review("P3.18-INTEROPERABILITY-001", "CCI interoperability", ["interfaces", "api", "messaging", "federation"], [sdk.api_validation.report_id, sdk.interface_report.report_id, sdk.compatibility.report_id], interoperabilityOk);
  const readiness = nested({
    readiness_id: "P3.18-READINESS-001",
    operational_ready: operationalReady,
    deployment_ready: operationalReady,
    observability_ready: operationalReady,
    incident_ready: operationalReady,
    sdk_ready: consumerReady,
    interface_ready: consumerReady,
    migration_ready: consumerReady,
    adoption_ready: consumerReady,
    result: operationalReady && consumerReady ? "PASS" as const : "FAIL" as const,
  });
  const maturity = nested({
    assessment_id: "P3.18-MATURITY-001",
    feature_completeness: maturityScore,
    governance_maturity: maturityScore,
    operational_maturity: maturityScore,
    ecosystem_readiness: maturityScore,
    maturity_score: maturityScore,
    threshold: 90,
    result: maturityScore >= 90 ? "PASS" as const : "FAIL" as const,
  });
  const ledger = nested({
    ledger_id: "P3.18-QUALIFICATION-EVIDENCE-LEDGER-001",
    assurance_report_refs: evidenceOk ? freezeArray([assurance.assurance_report.report_id]) : freezeArray([]),
    qualification_evidence_refs: evidenceOk ? freezeArray([assurance.qualification_evidence.qualification_evidence_id]) : freezeArray([]),
    replay_evidence_refs: replayOk ? freezeArray([replay.replay_evidence.evidence_id]) : freezeArray([]),
    operational_evidence_refs: operationalReady ? freezeArray([operations.operational_evidence.evidence_id]) : freezeArray([]),
    interface_report_refs: consumerReady ? freezeArray([sdk.interface_certification.report_id]) : freezeArray([]),
    migration_readiness_refs: consumerReady ? freezeArray([migration.readiness_assessment.assessment_id, migration.adoption_report.report_id]) : freezeArray([]),
    cci_contract_refs: constitutionalOk ? freezeArray(["cci:constitutional-contracts", "cci:evidence-infrastructure", "cci:certification-services"]) : freezeArray([]),
    audit_refs: evidenceOk ? freezeArray(["audit:p3.18:qualification"]) : freezeArray([]),
    lineage_refs: evidenceOk ? freezeArray([assurance.integrity_hash, certification.integrity_hash, sdk.integrity_hash, migration.integrity_hash]) : freezeArray([]),
    immutable: evidenceOk,
    complete: evidenceOk,
    replay_consumed_not_executed: replayOk,
  });
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(!constitutionalOk ? ["CONSTITUTIONAL_COMPLIANCE_FAILED" as const] : []),
    ...(!architectureOk ? ["ARCHITECTURE_INCOMPLETE" as const] : []),
    ...(!governanceOk ? ["GOVERNANCE_IMPLEMENTATION_FAILED" as const] : []),
    ...(!authorityOk ? ["AUTHORITY_ENFORCEMENT_FAILED" as const] : []),
    ...(!policyOk ? ["POLICY_ENFORCEMENT_FAILED" as const] : []),
    ...(!safetyOk ? ["SAFETY_ENFORCEMENT_FAILED" as const] : []),
    ...(!replayOk ? ["REPLAY_EVIDENCE_NOT_CONSUMED" as const] : []),
    ...(!evidenceOk ? ["EVIDENCE_INCOMPLETE" as const] : []),
    ...(!interoperabilityOk ? ["INTEROPERABILITY_FAILED" as const] : []),
    ...(readiness.result !== "PASS" ? ["OPERATIONAL_READINESS_FAILED" as const] : []),
    ...(readiness.result !== "PASS" ? ["CONSUMER_READINESS_FAILED" as const] : []),
    ...(maturity.result !== "PASS" ? ["MATURITY_THRESHOLD_NOT_MET" as const] : []),
    ...(has(failures, "PLATFORM_CERTIFICATION_DUPLICATED") ? ["PLATFORM_CERTIFICATION_DUPLICATED" as const] : []),
    ...(has(failures, "PRODUCTION_DEPLOYMENT_ATTEMPTED") ? ["PRODUCTION_DEPLOYMENT_ATTEMPTED" as const] : []),
    ...(has(failures, "MIGRATION_EXECUTION_ATTEMPTED") ? ["MIGRATION_EXECUTION_ATTEMPTED" as const] : []),
    ...(has(failures, "ASSURANCE_AGGREGATION_DUPLICATED") ? ["ASSURANCE_AGGREGATION_DUPLICATED" as const] : []),
  ])]);
  const decisionType = decisionFor(derivedFailures, scenario === "CONDITIONAL_DEFICIENCIES_ACCEPTED");
  const report = nested({
    report_id: has(derivedFailures, "QUALIFICATION_REPORT_MISSING") ? "" : "P3.18-PROGRAM-QUALIFICATION-REPORT-001",
    constitutional_summary: "Constitutional, CCI, authority, policy, and safety obligations reviewed against immutable evidence.",
    architecture_summary: "CAF Legion architecture reviewed against approved Program 3 module, dependency, interface, and contract requirements.",
    governance_summary: "Governance hierarchy, approval workflows, enforcement evidence, and authority controls reviewed.",
    readiness_summary: "Operational and consumer adoption readiness reviewed from P3.13, P3.16, and P3.17 evidence.",
    maturity_summary: `CAF Legion maturity score ${maturity.maturity_score} measured against threshold ${maturity.threshold}.`,
    recommendation: decisionType,
    generated: !has(derivedFailures, "QUALIFICATION_REPORT_MISSING"),
  });
  const finalFailures = freezeArray([...new Set([
    ...derivedFailures,
    ...(report.generated ? [] : ["QUALIFICATION_REPORT_MISSING" as const]),
    ...(has(derivedFailures, "QUALIFICATION_DECISION_MISSING") ? ["QUALIFICATION_DECISION_MISSING" as const] : []),
  ])]);
  const finalDecisionType = has(finalFailures, "QUALIFICATION_DECISION_MISSING") ? "NOT_QUALIFIED" as const : decisionFor(finalFailures, scenario === "CONDITIONAL_DEFICIENCIES_ACCEPTED");
  const decision = nested({
    decision_id: has(finalFailures, "QUALIFICATION_DECISION_MISSING") ? "" : "P3.18-QUALIFICATION-DECISION-001",
    decision: finalDecisionType,
    outcome: outcomeFor(finalDecisionType, finalFailures),
    accepted_conditions: scenario === "CONDITIONAL_DEFICIENCIES_ACCEPTED" ? freezeArray(["minor documentation deficiency accepted for certification intake review"]) : freezeArray([]),
    certification_submission_ref: finalDecisionType === "NOT_QUALIFIED" ? "" : "submit-to:p3.15:platform-certification",
    certification_authority_retained_by_p3_15: !has(finalFailures, "PLATFORM_CERTIFICATION_DUPLICATED"),
    evidence_driven: ledger.complete && ledger.immutable,
    deterministic: true,
    failures: finalFailures,
  });
  const base: Omit<ProgramQualificationResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    replay_evidence_ref: "caf-behavioral-replay-divergence/v3.11",
    operational_evidence_ref: "caf-operations-incident-governance/v3.13",
    platform_assurance_ref: "caf-platform-assurance/v3.14",
    platform_certification_requirements_ref: "caf-platform-certification/v3.15",
    interface_qualification_ref: "caf-sdk-interface-qualification/v3.16",
    migration_readiness_ref: "caf-consumer-adoption-migration/v3.17",
    framework,
    constitutional_review,
    architecture_review,
    governance_review,
    authority_review,
    policy_review,
    safety_review,
    replay_review,
    evidence_review,
    interoperability_review,
    readiness,
    maturity,
    evidence_ledger: ledger,
    report,
    decision,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateProgramQualification(result?: ProgramQualificationResult): ProgramQualificationValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, framework_valid: false, constitutional_valid: false, architecture_valid: false, governance_valid: false, authority_valid: false, policy_valid: false, safety_valid: false, replay_review_valid: false, evidence_valid: false, interoperability_valid: false, readiness_valid: false, maturity_valid: false, report_valid: false, decision_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const framework_valid = verifyHashedRecord(result.framework) && result.framework.lifecycle.length === LIFECYCLE.length && result.framework.deterministic;
  const constitutional_valid = verifyHashedRecord(result.constitutional_review) && result.constitutional_review.result === "PASS";
  const architecture_valid = verifyHashedRecord(result.architecture_review) && result.architecture_review.result === "PASS";
  const governance_valid = verifyHashedRecord(result.governance_review) && result.governance_review.result === "PASS";
  const authority_valid = verifyHashedRecord(result.authority_review) && result.authority_review.result === "PASS";
  const policy_valid = verifyHashedRecord(result.policy_review) && result.policy_review.result === "PASS";
  const safety_valid = verifyHashedRecord(result.safety_review) && result.safety_review.result === "PASS";
  const replay_review_valid = verifyHashedRecord(result.replay_review) && result.replay_review.result === "PASS" && result.evidence_ledger.replay_consumed_not_executed;
  const evidence_valid = verifyHashedRecord(result.evidence_review) && verifyHashedRecord(result.evidence_ledger) && result.evidence_review.result === "PASS" && result.evidence_ledger.complete && result.evidence_ledger.immutable && result.evidence_ledger.lineage_refs.length > 0;
  const interoperability_valid = verifyHashedRecord(result.interoperability_review) && result.interoperability_review.result === "PASS";
  const readiness_valid = verifyHashedRecord(result.readiness) && result.readiness.result === "PASS";
  const maturity_valid = verifyHashedRecord(result.maturity) && result.maturity.result === "PASS";
  const report_valid = verifyHashedRecord(result.report) && result.report.generated;
  const decision_valid = verifyHashedRecord(result.decision) && result.decision.decision !== "NOT_QUALIFIED" && result.decision.certification_authority_retained_by_p3_15 && result.decision.evidence_driven && result.decision.deterministic;
  const valid = replay_hash_valid && integrity_hash_valid && framework_valid && constitutional_valid && architecture_valid && governance_valid && authority_valid && policy_valid && safety_valid && replay_review_valid && evidence_valid && interoperability_valid && readiness_valid && maturity_valid && report_valid && decision_valid;
  return nested({ valid, outcome: result.decision.outcome, replay_hash_valid, integrity_hash_valid, framework_valid, constitutional_valid, architecture_valid, governance_valid, authority_valid, policy_valid, safety_valid, replay_review_valid, evidence_valid, interoperability_valid, readiness_valid, maturity_valid, report_valid, decision_valid, failures: result.decision.failures });
}

export function replayProgramQualification(result = runProgramQualification()): boolean {
  const replayed = runProgramQualification();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateProgramQualification(result).valid;
}

export function getProgramQualificationBundle(): ProgramQualificationBundle {
  const result = runProgramQualification();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_constitutional_qualification: true,
      owns_architectural_qualification: true,
      owns_governance_qualification: true,
      owns_authority_qualification: true,
      owns_policy_qualification: true,
      owns_safety_qualification: true,
      owns_replay_qualification: true,
      owns_evidence_qualification: true,
      owns_interoperability_qualification: true,
      owns_operational_readiness: true,
      owns_consumer_readiness: true,
      owns_platform_maturity_assessment: true,
      owns_platform_certification: false,
      owns_certification_issuance: false,
      owns_production_deployment: false,
      owns_migration_execution: false,
      owns_replay_execution: false,
      owns_assurance_aggregation: false,
    }),
    result,
    validation: validateProgramQualification(result),
  });
}

export const ProgramQualificationService = Object.freeze({
  run: runProgramQualification,
  validate: validateProgramQualification,
  replay: replayProgramQualification,
});
