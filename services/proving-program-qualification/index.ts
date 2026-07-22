import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runProvingEcosystemValidationFederation, validateProvingEcosystemValidationFederation } from "@/services/proving-ecosystem-validation-federation";
import type { ProgramQualificationBundle, ProgramQualificationDecision, ProgramQualificationFailure, ProgramQualificationInput, ProgramQualificationResult, ProgramQualificationScenario, ProgramQualificationValidation, QualificationDomain, QualificationEvidenceCategory } from "@/types/proving-program-qualification";

const VERSION = "proving-program-qualification/v6.18" as const;
const IDENTIFIER = "ProvingProgramQualification" as const;
const DOMAINS = Object.freeze<QualificationDomain[]>(["CONSTITUTIONAL", "ARCHITECTURE", "DETERMINISTIC_PROVING", "SYNTHETIC_ENVIRONMENT", "VALIDATION_CAPABILITY", "CONTINUOUS_PROVING", "GOVERNANCE", "SAFETY", "EXPLAINABILITY", "HUMAN_OVERSIGHT", "EVIDENCE", "READINESS", "FEDERATION", "CERTIFICATION_REHEARSAL", "ECOSYSTEM"]);
const EVIDENCE_CATEGORIES = Object.freeze<QualificationEvidenceCategory[]>(["QUALIFICATION_FINDINGS", "QUALIFICATION_REPORTS", "VALIDATION_EVIDENCE", "PROVING_EVIDENCE", "GOVERNANCE_EVIDENCE", "BENCHMARK_EVIDENCE", "READINESS_EVIDENCE", "FEDERATION_EVIDENCE", "LINEAGE_EVIDENCE"]);
const P6_PHASES = Object.freeze(["P6.1", "P6.2", "P6.3", "P6.4", "P6.5", "P6.6", "P6.7", "P6.8", "P6.9", "P6.10", "P6.11", "P6.12", "P6.13", "P6.14", "P6.15", "P6.16", "P6.17"]);
let federationBaseline: ReturnType<typeof runProvingEcosystemValidationFederation> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly ProgramQualificationFailure[], failure: ProgramQualificationFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: ProgramQualificationScenario): ProgramQualificationFailure | undefined { return scenario === "BASELINE" || scenario === "CONDITIONALLY_QUALIFIED" ? undefined : scenario; }
function finalDecision(failures: readonly ProgramQualificationFailure[], scenario: ProgramQualificationScenario): ProgramQualificationDecision {
  if (has(failures, "P6_17_FEDERATION_INVALID") || has(failures, "PREVIOUS_PHASE_INCOMPLETE") || has(failures, "REQUIRED_ARTIFACT_MISSING") || has(failures, "EVIDENCE_INCOMPLETE") || has(failures, "EVIDENCE_NOT_IMMUTABLE") || has(failures, "LINEAGE_NOT_IMMUTABLE") || has(failures, "TRACEABILITY_INCOMPLETE") || has(failures, "REPRODUCIBILITY_FAILED") || has(failures, "GOVERNANCE_APPROVAL_MISSING") || has(failures, "INDEPENDENT_QUALIFICATION_VIOLATED") || has(failures, "FINAL_APPROVAL_RECORD_MISSING")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONALLY_QUALIFIED") return "CONDITIONALLY_QUALIFIED";
  return "QUALIFIED";
}
function resultReplayHash(result: Omit<ProgramQualificationResult, "replay_hash" | "integrity_hash">): string { return hash({ domains: result.domain_reports.map((report) => report.integrity_hash), report: result.program_report.integrity_hash, evidence: result.evidence_ledger.integrity_hash, traceability: result.traceability_matrix.integrity_hash, cross_program: result.cross_program_matrix.integrity_hash, approval: result.approval_record.integrity_hash, decision: result.decision_record.integrity_hash, gates: result.gates.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<ProgramQualificationResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runProvingProgramQualification(input: ProgramQualificationInput = {}): ProgramQualificationResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<ProgramQualificationFailure>(direct ? [direct] : []);
  federationBaseline ??= runProvingEcosystemValidationFederation();
  const federation = federationBaseline;
  const federationInvalid = !validateProvingEcosystemValidationFederation(federation).valid || has(scenarioFailures, "P6_17_FEDERATION_INVALID");
  const failures = freezeArray([...new Set([...scenarioFailures, ...(federationInvalid ? ["P6_17_FEDERATION_INVALID" as const] : [])])]);
  const preconditionsOk = !has(failures, "PREVIOUS_PHASE_INCOMPLETE") && !has(failures, "REQUIRED_ARTIFACT_MISSING") && !federationInvalid;
  const constitutionalOk = !has(failures, "CONSTITUTIONAL_QUALIFICATION_FAILED");
  const architectureOk = !has(failures, "ARCHITECTURE_QUALIFICATION_FAILED");
  const deterministicOk = !has(failures, "DETERMINISTIC_PROVING_FAILED") && !has(failures, "DETERMINISTIC_REPLAY_FAILED") && !has(failures, "SIMULATION_CORRECTNESS_FAILED");
  const environmentOk = !has(failures, "SYNTHETIC_ENVIRONMENT_FIDELITY_FAILED") && !has(failures, "DIGITAL_TWIN_ACCURACY_FAILED");
  const validationOk = !has(failures, "VALIDATION_CAPABILITY_FAILED") && !has(failures, "ADVERSARIAL_TESTING_CAPABILITY_FAILED") && !has(failures, "RESILIENCE_VALIDATION_FAILED") && !has(failures, "INTEROPERABILITY_VALIDATION_FAILED") && !has(failures, "BENCHMARK_COMPLETENESS_FAILED") && !has(failures, "OPERATIONAL_EXERCISE_CAPABILITY_FAILED");
  const continuousOk = !has(failures, "CONTINUOUS_PROVING_FAILED") && !has(failures, "REGRESSION_VALIDATION_FAILED");
  const governanceOk = !has(failures, "GOVERNANCE_COMPLIANCE_FAILED") && !has(failures, "AUTHORITY_COMPLIANCE_FAILED") && !has(failures, "POLICY_ENFORCEMENT_FAILED") && !has(failures, "GOVERNANCE_APPROVAL_MISSING");
  const safetyTrustOk = !has(failures, "SAFETY_QUALIFICATION_FAILED") && !has(failures, "TRUST_QUALIFICATION_FAILED");
  const explainabilityOversightOk = !has(failures, "EXPLAINABILITY_QUALIFICATION_FAILED") && !has(failures, "HUMAN_OVERSIGHT_FAILED");
  const evidenceOk = !has(failures, "EVIDENCE_INCOMPLETE") && !has(failures, "EVIDENCE_NOT_IMMUTABLE") && !has(failures, "LINEAGE_NOT_IMMUTABLE") && !has(failures, "TRACEABILITY_INCOMPLETE") && !has(failures, "REPRODUCIBILITY_FAILED");
  const readinessOk = !has(failures, "READINESS_QUALIFICATION_FAILED") && !has(failures, "OPERATIONAL_READINESS_FAILED") && !has(failures, "CONSUMER_READINESS_FAILED") && !has(failures, "ECOSYSTEM_READINESS_FAILED");
  const federationOk = !has(failures, "FEDERATION_QUALIFICATION_FAILED") && !federationInvalid;
  const certificationOk = !has(failures, "CERTIFICATION_REHEARSAL_FAILED");
  const ecosystemOk = !has(failures, "ECOSYSTEM_QUALIFICATION_FAILED") && !has(failures, "CROSS_PROGRAM_VERIFICATION_FAILED");
  const independentOk = !has(failures, "INDEPENDENT_QUALIFICATION_VIOLATED");
  const approvalOk = !has(failures, "GOVERNANCE_APPROVAL_MISSING") && !has(failures, "FINAL_APPROVAL_RECORD_MISSING");
  const decision = finalDecision(failures, scenario);
  const domainStatus = (domain: QualificationDomain): boolean => {
    if (domain === "CONSTITUTIONAL") return constitutionalOk;
    if (domain === "ARCHITECTURE") return architectureOk && preconditionsOk;
    if (domain === "DETERMINISTIC_PROVING") return deterministicOk;
    if (domain === "SYNTHETIC_ENVIRONMENT") return environmentOk;
    if (domain === "VALIDATION_CAPABILITY") return validationOk;
    if (domain === "CONTINUOUS_PROVING") return continuousOk;
    if (domain === "GOVERNANCE") return governanceOk;
    if (domain === "SAFETY") return safetyTrustOk;
    if (domain === "EXPLAINABILITY") return explainabilityOversightOk;
    if (domain === "HUMAN_OVERSIGHT") return explainabilityOversightOk;
    if (domain === "EVIDENCE") return evidenceOk;
    if (domain === "READINESS") return readinessOk;
    if (domain === "FEDERATION") return federationOk;
    if (domain === "CERTIFICATION_REHEARSAL") return certificationOk;
    return ecosystemOk;
  };
  const domain_reports = freezeArray(DOMAINS.map((domain) => nested({ report_id: domainStatus(domain) ? `report:p6.18:${domain.toLowerCase()}` : "", domain, verified: domainStatus(domain), evidence_refs: domainStatus(domain) ? freezeArray([federation.qualification_package.package_id, federation.evidence.evidence_id]) : freezeArray<string>([]), findings: scenario === "CONDITIONALLY_QUALIFIED" ? freezeArray(["non-critical governance restriction required"]) : freezeArray<string>([]) })));
  const domainsVerified = domain_reports.filter((report) => report.verified).length;
  const program_report = nested({ report_id: "report:p6.18:program-qualification", domains_verified: domainsVerified, constitutional_requirements_verified: constitutionalOk, proving_authority_verified: decision !== "NOT_QUALIFIED", maturity_verified: ecosystemOk, certification_readiness_verified: certificationOk });
  const evidence_ledger = nested({ ledger_id: evidenceOk ? "ledger:p6.18:qualification-evidence" : "", categories: evidenceOk ? EVIDENCE_CATEGORIES : freezeArray<QualificationEvidenceCategory>([]), immutable: evidenceOk, lineage_immutable: evidenceOk, reproducible: evidenceOk && deterministicOk, complete: evidenceOk && preconditionsOk });
  const traceability_matrix = nested({ matrix_id: evidenceOk && independentOk ? "matrix:p6.18:traceability" : "", domains: evidenceOk ? DOMAINS : freezeArray<QualificationDomain>([]), p6_phases: preconditionsOk ? P6_PHASES : freezeArray<string>([]), programs: ecosystemOk ? freezeArray(["Program 1", "Program 2", "Program 3", "Program 4", "Program 5", "Program 6"]) : freezeArray<string>([]), evidence_lineage_complete: evidenceOk, independent_qualification: independentOk });
  const cross_program_matrix = nested({ matrix_id: ecosystemOk ? "matrix:p6.18:cross-program-qualification" : "", program_1: ecosystemOk, program_2: ecosystemOk, program_3: ecosystemOk, program_4: ecosystemOk, program_5: ecosystemOk && safetyTrustOk, compatibility_verified: ecosystemOk, trust_verified: safetyTrustOk, safety_verified: safetyTrustOk });
  const approval_record = nested({ approval_id: approvalOk ? "approval:p6.18:final-constitutional" : "", governance_approved: approvalOk, authority_granted: approvalOk && decision === "QUALIFIED", production_ecosystem_use_authorized: approvalOk && decision === "QUALIFIED", supersession_or_revocation_required_for_change: approvalOk });
  const decision_record = nested({ decision_id: "decision:p6.18:program-qualification", decision, proving_authority_granted: decision === "QUALIFIED", production_use_authorized: decision === "QUALIFIED", restrictions: decision === "CONDITIONALLY_QUALIFIED" ? freezeArray(["deployment permitted only under approved governance restrictions"]) : freezeArray<string>([]), rationale: freezeArray(decision === "QUALIFIED" ? ["Civitas Proving Ground qualified as constitutional proving authority"] : decision === "CONDITIONALLY_QUALIFIED" ? ["non-critical deficiencies require governed restrictions"] : ["critical constitutional qualification requirements failed"]) });
  const gates = nested({ gate_id: "P6.18-QUALIFICATION-GATES", precondition_gate: preconditionsOk, constitutional_gate: constitutionalOk, architecture_gate: architectureOk, deterministic_gate: deterministicOk && environmentOk, validation_gate: validationOk, continuous_gate: continuousOk, governance_gate: governanceOk, safety_trust_gate: safetyTrustOk, explainability_oversight_gate: explainabilityOversightOk, evidence_gate: evidenceOk, readiness_gate: readinessOk, federation_gate: federationOk, certification_rehearsal_gate: certificationOk, ecosystem_gate: ecosystemOk, approval_gate: approvalOk, passed: false });
  const finalGates = nested({ ...gates, passed: gates.precondition_gate && gates.constitutional_gate && gates.architecture_gate && gates.deterministic_gate && gates.validation_gate && gates.continuous_gate && gates.governance_gate && gates.safety_trust_gate && gates.explainability_oversight_gate && gates.evidence_gate && gates.readiness_gate && gates.federation_gate && gates.certification_rehearsal_gate && gates.ecosystem_gate && gates.approval_gate });
  const derivedFailures = freezeArray([...new Set([...failures, ...(!preconditionsOk ? ["PREVIOUS_PHASE_INCOMPLETE" as const] : []), ...(!constitutionalOk ? ["CONSTITUTIONAL_QUALIFICATION_FAILED" as const] : []), ...(!architectureOk ? ["ARCHITECTURE_QUALIFICATION_FAILED" as const] : []), ...(!deterministicOk ? ["DETERMINISTIC_PROVING_FAILED" as const] : []), ...(!environmentOk ? ["SYNTHETIC_ENVIRONMENT_FIDELITY_FAILED" as const] : []), ...(!validationOk ? ["VALIDATION_CAPABILITY_FAILED" as const] : []), ...(!continuousOk ? ["CONTINUOUS_PROVING_FAILED" as const] : []), ...(!governanceOk ? ["GOVERNANCE_COMPLIANCE_FAILED" as const] : []), ...(!safetyTrustOk ? ["SAFETY_QUALIFICATION_FAILED" as const] : []), ...(!explainabilityOversightOk ? ["EXPLAINABILITY_QUALIFICATION_FAILED" as const] : []), ...(!evidenceOk ? ["EVIDENCE_INCOMPLETE" as const] : []), ...(!readinessOk ? ["READINESS_QUALIFICATION_FAILED" as const] : []), ...(!federationOk ? ["FEDERATION_QUALIFICATION_FAILED" as const] : []), ...(!certificationOk ? ["CERTIFICATION_REHEARSAL_FAILED" as const] : []), ...(!ecosystemOk ? ["ECOSYSTEM_QUALIFICATION_FAILED" as const] : []), ...(!approvalOk ? ["GOVERNANCE_APPROVAL_MISSING" as const] : [])])]);
  const readiness = nested({ readiness_id: "P6.18-PROGRAM-QUALIFICATION-001", decision, phase_ready: decision === "QUALIFIED" || decision === "CONDITIONALLY_QUALIFIED", qualification_ready: decision !== "NOT_QUALIFIED", evidence_ready: evidenceOk, traceability_ready: evidenceOk && independentOk, cross_program_ready: ecosystemOk, final_approval_ready: approvalOk, gates_passed: finalGates.passed, failures: derivedFailures });
  const base: Omit<ProgramQualificationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, federation_ref: "proving-ecosystem-validation-federation/v6.17", domain_reports, program_report, evidence_ledger, traceability_matrix, cross_program_matrix, approval_record, decision_record, gates: finalGates, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateProvingProgramQualification(result?: ProgramQualificationResult): ProgramQualificationValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, domain_reports_valid: false, program_report_valid: false, evidence_ledger_valid: false, traceability_valid: false, cross_program_valid: false, approval_valid: false, decision_valid: false, gates_valid: false, readiness_valid: false, failures: freezeArray(["PREVIOUS_PHASE_INCOMPLETE" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const domain_reports_valid = result.domain_reports.length === DOMAINS.length && result.domain_reports.every((report) => verifyHashed(report) && report.verified && report.evidence_refs.length >= 2);
  const program_report_valid = verifyHashed(result.program_report) && result.program_report.domains_verified === DOMAINS.length && result.program_report.constitutional_requirements_verified && result.program_report.proving_authority_verified;
  const evidence_ledger_valid = verifyHashed(result.evidence_ledger) && result.evidence_ledger.categories.length === EVIDENCE_CATEGORIES.length && result.evidence_ledger.immutable && result.evidence_ledger.lineage_immutable && result.evidence_ledger.reproducible && result.evidence_ledger.complete;
  const traceability_valid = verifyHashed(result.traceability_matrix) && result.traceability_matrix.domains.length === DOMAINS.length && result.traceability_matrix.p6_phases.length === P6_PHASES.length && result.traceability_matrix.evidence_lineage_complete && result.traceability_matrix.independent_qualification;
  const cross_program_valid = verifyHashed(result.cross_program_matrix) && result.cross_program_matrix.program_1 && result.cross_program_matrix.program_5 && result.cross_program_matrix.compatibility_verified && result.cross_program_matrix.trust_verified && result.cross_program_matrix.safety_verified;
  const approval_valid = verifyHashed(result.approval_record) && result.approval_record.governance_approved && result.approval_record.authority_granted && result.approval_record.production_ecosystem_use_authorized;
  const decision_valid = verifyHashed(result.decision_record) && result.decision_record.decision === "QUALIFIED" && result.decision_record.proving_authority_granted && result.decision_record.production_use_authorized;
  const gates_valid = verifyHashed(result.gates) && result.gates.passed;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && domain_reports_valid && program_report_valid && evidence_ledger_valid && traceability_valid && cross_program_valid && approval_valid && decision_valid && gates_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, domain_reports_valid, program_report_valid, evidence_ledger_valid, traceability_valid, cross_program_valid, approval_valid, decision_valid, gates_valid, readiness_valid, failures: result.readiness.failures });
}

export function replayProvingProgramQualification(result = runProvingProgramQualification()): boolean { const replayed = runProvingProgramQualification(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateProvingProgramQualification(result).valid; }
export function getProvingProgramQualificationBundle(): ProgramQualificationBundle { const result = runProvingProgramQualification(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_program_qualification: true, owns_proving_qualification: true, owns_proving_authority_verification: true, owns_qualification_governance: true, owns_qualification_decision: true, creates_no_new_proving_capabilities: true }), result, validation: validateProvingProgramQualification(result) }); }
export const ProvingProgramQualificationService = Object.freeze({ run: runProvingProgramQualification, validate: validateProvingProgramQualification, replay: replayProvingProgramQualification });
