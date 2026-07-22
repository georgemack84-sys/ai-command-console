import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runEcosystemPortfolioGovernance, validateEcosystemPortfolioGovernance } from "@/services/ecosystem-portfolio-governance";
import type { EcosystemApplicationQualificationBundle, EcosystemApplicationQualificationFailure, EcosystemApplicationQualificationInput, EcosystemApplicationQualificationResult, EcosystemApplicationQualificationScenario, EcosystemApplicationQualificationValidation, EcosystemQualificationAssessment, EcosystemQualificationDecision, EcosystemQualificationOutcome } from "@/types/ecosystem-application-qualification";

const VERSION = "ecosystem-application-qualification/v4.21" as const;
const IDENTIFIER = "EcosystemApplicationQualification" as const;
const TIMESTAMP = "2026-07-18T00:00:00.000Z" as const;
let baselinePortfolio: ReturnType<typeof runEcosystemPortfolioGovernance> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly EcosystemApplicationQualificationFailure[], failure: EcosystemApplicationQualificationFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: EcosystemApplicationQualificationScenario): EcosystemApplicationQualificationFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function outcome(failures: readonly EcosystemApplicationQualificationFailure[]): EcosystemQualificationOutcome { if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED"; return failures.length ? "FAIL" : "PASS"; }
function decision(failures: readonly EcosystemApplicationQualificationFailure[]): EcosystemQualificationDecision {
  if (has(failures, "GOVERNANCE_COMPLIANCE_INVALID") || has(failures, "CONSTITUTIONAL_COMPLIANCE_INVALID")) return "REQUIRES_GOVERNANCE_REVIEW";
  if (has(failures, "CONSUMER_READINESS_MISSING") || has(failures, "DOCUMENTATION_INCOMPLETE")) return "REQUIRES_OPERATOR_REVIEW";
  if (has(failures, "EVIDENCE_INCOMPLETE") || has(failures, "ASSURANCE_EVIDENCE_INCOMPLETE") || has(failures, "REPLAY_EVIDENCE_INCOMPLETE")) return "REQUIRES_MORE_EVIDENCE";
  return failures.length ? "NOT_QUALIFIED" : "QUALIFIED";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function getPortfolio() { baselinePortfolio ??= runEcosystemPortfolioGovernance(); return baselinePortfolio; }
function assess(id: string, domain: string, refs: readonly string[], failures: readonly EcosystemApplicationQualificationFailure[], missing: EcosystemApplicationQualificationFailure, invalids: readonly EcosystemApplicationQualificationFailure[]): EcosystemQualificationAssessment {
  const valid = !has(failures, missing) && invalids.every((failure) => !has(failures, failure));
  return nested({ assessment_id: valid ? id : "", domain, evidence_refs: freezeArray(refs), valid, findings: valid ? freezeArray([`${domain} qualified`]) : freezeArray([`${domain} failed qualification`]) });
}
function resultReplayHash(result: Omit<EcosystemApplicationQualificationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ record: result.record.integrity_hash, architecture: result.architecture.integrity_hash, governance: result.governance.integrity_hash, interoperability: result.interoperability.integrity_hash, operations: result.operations.integrity_hash, replay: result.replay.integrity_hash, assurance: result.assurance.integrity_hash, certificates: result.certificates.integrity_hash, evidence: result.evidence.integrity_hash, readiness: result.readiness.integrity_hash, report: result.report.integrity_hash, ledger: result.ledger.integrity_hash, boundary: result.boundary.integrity_hash, certification: result.certification.integrity_hash });
}
function resultIntegrityHash(result: Omit<EcosystemApplicationQualificationResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash }); }

export function runEcosystemApplicationQualification(input: EcosystemApplicationQualificationInput = {}): EcosystemApplicationQualificationResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<EcosystemApplicationQualificationFailure>(direct ? [direct] : []);
  const portfolio = getPortfolio();
  const dependencyFailures = freezeArray<EcosystemApplicationQualificationFailure>([
    ...(!validateEcosystemPortfolioGovernance(portfolio).valid || has(scenarioFailures, "P4_20_PORTFOLIO_GOVERNANCE_INVALID") ? ["P4_20_PORTFOLIO_GOVERNANCE_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_5_CERTIFICATES_INVALID") ? ["P4_5_CERTIFICATES_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_1_ASSURANCE_INVALID") ? ["PROGRAM_1_ASSURANCE_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_2_ASSURANCE_INVALID") ? ["PROGRAM_2_ASSURANCE_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_3_ASSURANCE_INVALID") ? ["PROGRAM_3_ASSURANCE_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const qualificationId = input.qualification_id ?? "qualification:program-4:ecosystem";
  const apps = portfolio.inventory.application_refs;
  const certificates = has(failures, "P4_5_CERTIFICATES_INVALID") ? freezeArray<string>([]) : portfolio.inventory.certificate_refs;
  const governanceRefs = has(failures, "GOVERNANCE_ASSESSMENT_MISSING") ? freezeArray<string>([]) : freezeArray([portfolio.reports.report_id]);
  const replayRefs = has(failures, "REPLAY_EVIDENCE_INCOMPLETE") ? freezeArray<string>([]) : freezeArray(["replay:evidence:program-4:complete"]);
  const interoperabilityRefs = has(failures, "INTEROPERABILITY_ASSESSMENT_MISSING") ? freezeArray<string>([]) : portfolio.inventory.interoperability_evidence_refs;
  const operationalRefs = has(failures, "OPERATIONAL_ASSESSMENT_MISSING") ? freezeArray<string>([]) : portfolio.inventory.operational_evidence_refs;
  const assuranceRefs = has(failures, "ASSURANCE_EVIDENCE_INCOMPLETE") ? freezeArray<string>([]) : freezeArray(["assurance:program-1", "assurance:program-2", "assurance:program-3"]);
  const architecture = assess("P4.21-ARCHITECTURE-ASSESSMENT-001", "Architecture Qualification", ["architecture:ecosystem", "dependency-graph:program-4"], failures, "ARCHITECTURE_ASSESSMENT_MISSING", ["ARCHITECTURE_INCOMPLETE", "DEPENDENCY_GRAPH_INVALID", "COMPOSITION_INVALID", "DEPLOYMENT_ARCHITECTURE_INVALID"]);
  const governance = assess("P4.21-GOVERNANCE-ASSESSMENT-001", "Governance Qualification", governanceRefs, failures, "GOVERNANCE_ASSESSMENT_MISSING", ["GOVERNANCE_COMPLIANCE_INVALID", "CONSTITUTIONAL_COMPLIANCE_INVALID", "AUTHORITY_ENFORCEMENT_INVALID", "POLICY_ENFORCEMENT_INVALID"]);
  const interoperability = assess("P4.21-INTEROPERABILITY-ASSESSMENT-001", "Interoperability Qualification", interoperabilityRefs, failures, "INTEROPERABILITY_ASSESSMENT_MISSING", ["FEDERATION_CONTRACTS_INVALID", "WORKFLOW_INTEGRATION_INVALID", "INTERFACE_COMPATIBILITY_INVALID", "ORCHESTRATION_INTEGRITY_INVALID"]);
  const operations = assess("P4.21-OPERATIONAL-ASSESSMENT-001", "Operational Qualification", operationalRefs, failures, "OPERATIONAL_ASSESSMENT_MISSING", ["OPERATIONAL_READINESS_INVALID", "DIAGNOSTICS_INVALID", "OBSERVABILITY_INVALID", "OPERATIONAL_RESILIENCE_INVALID"]);
  const replay = assess("P4.21-REPLAY-ASSESSMENT-001", "Replay Qualification", replayRefs, failures, "REPLAY_ASSESSMENT_MISSING", ["REPLAY_EVIDENCE_INCOMPLETE", "REPLAY_NOT_REPRODUCIBLE", "REPLAY_TRACEABILITY_INVALID"]);
  const assurance = assess("P4.21-ASSURANCE-ASSESSMENT-001", "Assurance Qualification", assuranceRefs, failures, "ASSURANCE_ASSESSMENT_MISSING", ["ASSURANCE_EVIDENCE_INCOMPLETE", "PROGRAM_1_ASSURANCE_INVALID", "PROGRAM_2_ASSURANCE_INVALID", "PROGRAM_3_ASSURANCE_INVALID"]);
  const certificatesAssessment = assess("P4.21-CERTIFICATE-VERIFICATION-001", "Certificate Verification", certificates, failures, "CERTIFICATE_VERIFICATION_MISSING", ["P4_5_CERTIFICATES_INVALID", "CERTIFICATE_LINEAGE_INVALID", "CERTIFICATE_STATUS_INVALID", "CERTIFICATE_DEPENDENCY_INVALID"]);
  const evidence = assess("P4.21-EVIDENCE-ASSESSMENT-001", "Evidence Qualification", [...certificates, ...governanceRefs, ...replayRefs, ...interoperabilityRefs, ...operationalRefs, ...assuranceRefs], failures, "EVIDENCE_ASSESSMENT_MISSING", ["EVIDENCE_INCOMPLETE", "PROVENANCE_INTEGRITY_INVALID", "EVIDENCE_LINEAGE_INVALID", "AUDIT_INCOMPLETE"]);
  const readiness = assess("P4.21-CONSUMER-READINESS-ASSESSMENT-001", "Consumer Readiness Qualification", ["readiness:consumer", "docs:operations", "docs:governance"], failures, "CONSUMER_READINESS_MISSING", ["ECOSYSTEM_USABILITY_INVALID", "DEPLOYMENT_READINESS_INVALID", "DOCUMENTATION_INCOMPLETE"]);
  const preliminaryFailures = freezeArray([...new Set([
    ...failures,
    ...(!architecture.valid ? ["ARCHITECTURE_ASSESSMENT_MISSING" as const] : []),
    ...(!governance.valid ? ["GOVERNANCE_ASSESSMENT_MISSING" as const] : []),
    ...(!interoperability.valid ? ["INTEROPERABILITY_ASSESSMENT_MISSING" as const] : []),
    ...(!operations.valid ? ["OPERATIONAL_ASSESSMENT_MISSING" as const] : []),
    ...(!replay.valid ? ["REPLAY_ASSESSMENT_MISSING" as const] : []),
    ...(!assurance.valid ? ["ASSURANCE_ASSESSMENT_MISSING" as const] : []),
    ...(!certificatesAssessment.valid ? ["CERTIFICATE_VERIFICATION_MISSING" as const] : []),
    ...(!evidence.valid ? ["EVIDENCE_ASSESSMENT_MISSING" as const] : []),
    ...(!readiness.valid ? ["CONSUMER_READINESS_MISSING" as const] : []),
  ])]);
  const qualificationDecision = decision(preliminaryFailures);
  const evidenceHash = hash({ certificates, governanceRefs, replayRefs, interoperabilityRefs, operationalRefs, assuranceRefs });
  const record = nested({ record_id: has(preliminaryFailures, "QUALIFICATION_RECORD_MISSING") ? "" : "P4.21-ECOSYSTEM-QUALIFICATION-RECORD-001", qualification_id: qualificationId, tenant_id: input.tenant_id ?? "tenant:qualified:primary", ecosystem_version: "program-4/v4.21" as const, qualification_scope: "Integrated Program 4 Application Ecosystem" as const, participating_applications: apps, consumed_application_certificates: certificates, governance_report_refs: governanceRefs, replay_evidence_refs: replayRefs, interoperability_evidence_refs: interoperabilityRefs, operational_evidence_refs: operationalRefs, assurance_evidence_refs: assuranceRefs, assessment_results: freezeArray([architecture.assessment_id, governance.assessment_id, interoperability.assessment_id, operations.assessment_id, replay.assessment_id, assurance.assessment_id, certificatesAssessment.assessment_id, evidence.assessment_id, readiness.assessment_id]), qualification_result: qualificationDecision, qualification_timestamp: TIMESTAMP, evaluator: "P4.21 Ecosystem Application Qualification" as const, evidence_hash: evidenceHash, operational: !has(preliminaryFailures, "QUALIFICATION_RECORD_MISSING"), deterministic: true });
  const report = nested({ report_id: has(preliminaryFailures, "QUALIFICATION_REPORT_MISSING") ? "" : "report:ecosystem-qualification:p4.21", executive_summary: "Integrated Program 4 ecosystem qualification complete.", architectural_findings: architecture.findings, governance_findings: governance.findings, interoperability_findings: interoperability.findings, operational_findings: operations.findings, replay_findings: replay.findings, assurance_findings: assurance.findings, evidence_findings: evidence.findings, readiness_findings: readiness.findings, qualification_conclusion: qualificationDecision, reproducible: !has(preliminaryFailures, "REPLAY_NOT_REPRODUCIBLE") });
  const ledger = nested({ ledger_entry_id: has(preliminaryFailures, "LEDGER_ENTRY_MISSING") ? "" : "ledger:ecosystem-qualification:p4.21", qualification_id: qualificationId, evidence_references: evidence.evidence_refs, lineage: freezeArray(["p4.5:certificates", "p4.20:governance-report", "p4.21:qualification"]), immutable_hash: hash({ qualificationId, evidenceHash, qualificationDecision }), timestamp: TIMESTAMP, immutable: !has(preliminaryFailures, "LEDGER_IMMUTABILITY_INVALID") });
  const boundary = nested({ certifies_individual_applications: has(preliminaryFailures, "INDIVIDUAL_APPLICATION_CERTIFICATION_ATTEMPTED"), executes_replay: has(preliminaryFailures, "REPLAY_EXECUTION_ATTEMPTED"), executes_interoperability_testing: has(preliminaryFailures, "INTEROPERABILITY_TEST_EXECUTION_ATTEMPTED"), performs_operational_monitoring: has(preliminaryFailures, "OPERATIONAL_MONITORING_ATTEMPTED"), performs_governance_aggregation: has(preliminaryFailures, "GOVERNANCE_AGGREGATION_ATTEMPTED"), modifies_application_certificates: has(preliminaryFailures, "APPLICATION_CERTIFICATE_MODIFICATION_ATTEMPTED"), overrides_program_assurance: has(preliminaryFailures, "PROGRAM_ASSURANCE_OVERRIDE_ATTEMPTED") });
  const noOutOfScope = !boundary.certifies_individual_applications && !boundary.executes_replay && !boundary.executes_interoperability_testing && !boundary.performs_operational_monitoring && !boundary.performs_governance_aggregation && !boundary.modifies_application_certificates && !boundary.overrides_program_assurance;
  const finalFailures = freezeArray([...new Set([
    ...preliminaryFailures,
    ...(record.record_id.length === 0 ? ["QUALIFICATION_RECORD_MISSING" as const] : []),
    ...(report.report_id.length === 0 ? ["QUALIFICATION_REPORT_MISSING" as const] : []),
    ...(ledger.ledger_entry_id.length === 0 ? ["LEDGER_ENTRY_MISSING" as const] : []),
    ...(!ledger.immutable ? ["LEDGER_IMMUTABILITY_INVALID" as const] : []),
    ...(qualificationDecision === "NOT_QUALIFIED" || qualificationDecision === "REQUIRES_MORE_EVIDENCE" || qualificationDecision === "REQUIRES_GOVERNANCE_REVIEW" || qualificationDecision === "REQUIRES_OPERATOR_REVIEW" ? ["QUALIFICATION_DECISION_MISSING" as const] : []),
    ...(!noOutOfScope ? ["INDIVIDUAL_APPLICATION_CERTIFICATION_ATTEMPTED" as const] : []),
  ])]);
  const finalDecision = decision(finalFailures);
  const certification = nested({ certification_id: "P4.21-ECOSYSTEM-APPLICATION-QUALIFICATION-CERTIFICATION-001", outcome: outcome(finalFailures), phase_ready: outcome(finalFailures) === "PASS", architecture_qualified: architecture.valid, governance_qualified: governance.valid, interoperability_qualified: interoperability.valid, operations_qualified: operations.valid, replay_qualified: replay.valid && report.reproducible, assurance_qualified: assurance.valid, certificates_verified: certificatesAssessment.valid, evidence_qualified: evidence.valid && ledger.immutable, consumer_ready: readiness.valid, report_generated: report.report_id.length > 0, ledger_recorded: ledger.ledger_entry_id.length > 0 && ledger.immutable, decision_issued: finalDecision === "QUALIFIED", no_out_of_scope_execution: noOutOfScope, failures: finalFailures });
  const base: Omit<EcosystemApplicationQualificationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, portfolio_governance_ref: "ecosystem-portfolio-governance/v4.20", record: nested({ ...record, qualification_result: finalDecision }), architecture, governance, interoperability, operations, replay, assurance, certificates: certificatesAssessment, evidence, readiness, report: nested({ ...report, qualification_conclusion: finalDecision }), ledger, boundary, certification };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateEcosystemApplicationQualification(result?: EcosystemApplicationQualificationResult): EcosystemApplicationQualificationValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, record_valid: false, architecture_valid: false, governance_valid: false, interoperability_valid: false, operations_valid: false, replay_valid: false, assurance_valid: false, certificates_valid: false, evidence_valid: false, readiness_valid: false, report_valid: false, ledger_valid: false, boundary_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const record_valid = verifyHashedRecord(result.record) && result.record.operational && result.record.qualification_result === "QUALIFIED" && result.record.consumed_application_certificates.length > 0;
  const architecture_valid = verifyHashedRecord(result.architecture) && result.architecture.valid;
  const governance_valid = verifyHashedRecord(result.governance) && result.governance.valid;
  const interoperability_valid = verifyHashedRecord(result.interoperability) && result.interoperability.valid;
  const operations_valid = verifyHashedRecord(result.operations) && result.operations.valid;
  const replay_valid = verifyHashedRecord(result.replay) && result.replay.valid;
  const assurance_valid = verifyHashedRecord(result.assurance) && result.assurance.valid;
  const certificates_valid = verifyHashedRecord(result.certificates) && result.certificates.valid;
  const evidence_valid = verifyHashedRecord(result.evidence) && result.evidence.valid;
  const readiness_valid = verifyHashedRecord(result.readiness) && result.readiness.valid;
  const report_valid = verifyHashedRecord(result.report) && result.report.report_id.length > 0 && result.report.reproducible && result.report.qualification_conclusion === "QUALIFIED";
  const ledger_valid = verifyHashedRecord(result.ledger) && result.ledger.ledger_entry_id.length > 0 && result.ledger.immutable && result.ledger.immutable_hash.length > 0;
  const boundary_valid = verifyHashedRecord(result.boundary) && !result.boundary.certifies_individual_applications && !result.boundary.executes_replay && !result.boundary.executes_interoperability_testing && !result.boundary.performs_operational_monitoring && !result.boundary.performs_governance_aggregation && !result.boundary.modifies_application_certificates && !result.boundary.overrides_program_assurance;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.phase_ready && result.certification.decision_issued && result.certification.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && record_valid && architecture_valid && governance_valid && interoperability_valid && operations_valid && replay_valid && assurance_valid && certificates_valid && evidence_valid && readiness_valid && report_valid && ledger_valid && boundary_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, record_valid, architecture_valid, governance_valid, interoperability_valid, operations_valid, replay_valid, assurance_valid, certificates_valid, evidence_valid, readiness_valid, report_valid, ledger_valid, boundary_valid, certification_valid, failures: result.certification.failures });
}

export function replayEcosystemApplicationQualification(result = runEcosystemApplicationQualification()): boolean {
  const replayed = runEcosystemApplicationQualification();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateEcosystemApplicationQualification(result).valid;
}

export function getEcosystemApplicationQualificationBundle(): EcosystemApplicationQualificationBundle {
  const result = runEcosystemApplicationQualification();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_ecosystem_qualification: true, owns_ecosystem_readiness_assessment: true, owns_qualification_evidence_production: true, owns_qualification_decision_issuance: true, certifies_individual_applications: false, executes_replay: false, executes_interoperability_testing: false, performs_operational_monitoring: false, performs_governance_aggregation: false, modifies_application_certificates: false }), result, validation: validateEcosystemApplicationQualification(result) });
}

export const EcosystemApplicationQualificationService = Object.freeze({ run: runEcosystemApplicationQualification, validate: validateEcosystemApplicationQualification, replay: replayEcosystemApplicationQualification });
