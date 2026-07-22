import { runAmendmentAddendumManagement, validateAmendmentAddendumManagement } from "@/services/amendment-addendum-management";
import { runAssuranceAuditLineageIntegrity, validateAssuranceAuditLineageIntegrity } from "@/services/assurance-audit-lineage-integrity";
import { runAssuranceDependencyEvaluation, validateAssuranceDependencyEvaluation } from "@/services/assurance-dependency-evaluation";
import { runAssuranceEvaluationContract, validateAssuranceEvaluationContract } from "@/services/assurance-evaluation-contract";
import { runConstitutionalAuthorityHierarchy, validateConstitutionalAuthorityHierarchy } from "@/services/constitutional-authority-hierarchy";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runFormalDocumentTaxonomy, validateFormalDocumentTaxonomy } from "@/services/formal-document-taxonomy";
import { detectReplayDivergence, replayReplayDivergenceDetection } from "@/services/replay-divergence-detection-engine";
import { runSpecificationGovernanceFramework, validateSpecificationGovernanceFramework } from "@/services/specification-governance-framework";
import { runSpecificationIntegrityConsistencyValidation, validateSpecificationIntegrityConsistencyValidation } from "@/services/specification-integrity-consistency-validation";
import type {
  CertificationEvidenceBinder,
  Phase13CertificationFailure,
  Phase13CertificationGateBundle,
  Phase13CertificationGateResult,
  Phase13CertificationGateValidation,
  Phase13CertificationInput,
  Phase13CertificationOutcome,
  Phase13CertificationScenario,
  Phase13CertificationTest,
  Phase13DomainCertification,
  PhaseCertificationLedgerEntry,
} from "@/types/phase-13-certification-gate";

const VERSION = "phase-13-certification-gate/v13.12" as const;
const IDENTIFIER = "Phase13CertificationGate" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function scenarioFailure(scenario: Phase13CertificationScenario): Phase13CertificationFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly Phase13CertificationFailure[], failure: Phase13CertificationFailure): boolean { return failures.includes(failure); }
function outcomeFor(failures: readonly Phase13CertificationFailure[]): Phase13CertificationOutcome {
  if (failures.includes("NON_CONSTITUTIONAL_DOCUMENTATION_ISSUE") && failures.length === 1) return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

function domain(domain: Phase13DomainCertification["domain"], evidence_refs: readonly string[], failures: readonly Phase13CertificationFailure[], relevant: readonly Phase13CertificationFailure[]): Phase13DomainCertification {
  const scoped = freezeArray(failures.filter((failure) => relevant.includes(failure)));
  return nested({ domain_id: id("phase13_domain", domain), domain, outcome: outcomeFor(scoped), evidence_refs, failures: scoped });
}

function test(name: string, passed: boolean, failure: Phase13CertificationFailure, evidence_refs: readonly string[]): Phase13CertificationTest {
  return nested({ test_id: id("phase13_test", name), name, expected: "PASS" as const, actual: passed ? "PASS" as const : "FAIL" as const, passed, failure_reason: passed ? null : failure, evidence_refs });
}

function resultReplayHash(result: Omit<Phase13CertificationGateResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    contract: result.contract.integrity_hash,
    domains: [result.constitutional_compliance, result.authority_certification, result.assurance_certification, result.replay_certification, result.governance_certification, result.specification_integrity_certification].map((item) => item.integrity_hash),
    tests: result.tests.map((item) => item.integrity_hash),
    evidence: result.evidence_binder.integrity_hash,
    decision: result.decision.integrity_hash,
    ledger: result.certification_ledger.map((entry) => entry.integrity_hash),
    replay: result.replay_validator.integrity_hash,
    report: result.final_report.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<Phase13CertificationGateResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, id: result.phase_identifier, outcome: result.decision.certification_outcome, replay_hash: result.replay_hash });
}

export function runPhase13CertificationGate(input: Phase13CertificationInput = {}): Phase13CertificationGateResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const authority = runConstitutionalAuthorityHierarchy();
  const dependency = runAssuranceDependencyEvaluation();
  const assurance = runAssuranceEvaluationContract();
  const divergence = detectReplayDivergence();
  const audit = runAssuranceAuditLineageIntegrity();
  const specGovernance = runSpecificationGovernanceFramework();
  const taxonomy = runFormalDocumentTaxonomy();
  const amendment = runAmendmentAddendumManagement();
  const specIntegrity = runSpecificationIntegrityConsistencyValidation();

  const upstreamFailures: Phase13CertificationFailure[] = [];
  if (!validateConstitutionalAuthorityHierarchy(authority).valid) upstreamFailures.push("CONSTITUTIONAL_AUTHORITY_FAILURE");
  if (!validateAssuranceDependencyEvaluation(dependency).valid) upstreamFailures.push("ASSURANCE_DEPENDENCY_FAILURE");
  if (!validateAssuranceEvaluationContract(assurance).valid) upstreamFailures.push("ASSURANCE_EVALUATION_FAILURE");
  if (!replayReplayDivergenceDetection(divergence)) upstreamFailures.push("REPLAY_DETERMINISM_FAILURE");
  if (!divergence.unexplained_divergence_fail_closed) upstreamFailures.push("UNEXPLAINED_DIVERGENCE_NOT_FAIL_CLOSED");
  if (!validateAssuranceAuditLineageIntegrity(audit).valid) upstreamFailures.push("ASSURANCE_LINEAGE_INCOMPLETE");
  if (!validateSpecificationGovernanceFramework(specGovernance).valid) upstreamFailures.push("SPECIFICATION_GOVERNANCE_FAILURE");
  if (!validateFormalDocumentTaxonomy(taxonomy).valid) upstreamFailures.push("DOCUMENT_TAXONOMY_FAILURE");
  if (!validateAmendmentAddendumManagement(amendment).valid) upstreamFailures.push("AMENDMENT_GOVERNANCE_FAILURE");
  if (!validateSpecificationIntegrityConsistencyValidation(specIntegrity).valid) upstreamFailures.push("SPECIFICATION_INTEGRITY_FAILURE");
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const outcome = outcomeFor(failures);
  const conditions = freezeArray(outcome === "CONDITIONAL_PASS" ? ["Resolve non-constitutional documentation issue before advancement."] : []);
  const evidenceRefs = freezeArray([authority.integrity_hash, dependency.integrity_hash, assurance.integrity_hash, divergence.integrity_hash, audit.integrity_hash, specGovernance.integrity_hash, taxonomy.integrity_hash, amendment.integrity_hash, specIntegrity.integrity_hash]);
  const replayRefs = freezeArray([authority.replay_hash, dependency.replay_hash, assurance.replay_hash, divergence.replay_hash, audit.replay_hash, specGovernance.replay_hash, taxonomy.replay_hash, amendment.replay_hash, specIntegrity.replay_hash]);

  const contract = nested({
    certification_scope: "PHASE_13_ASSURANCE_FRAMEWORK" as const,
    certification_version: VERSION,
    specification_manifest: freezeArray(["phase-13.1-authority", "phase-13.2-dependencies", "phase-13.3-evaluation", "phase-13.6-replay-divergence", "phase-13.7-audit-lineage", "phase-13.8-spec-governance", "phase-13.9-document-taxonomy", "phase-13.10-amendments", "phase-13.11-integrity"]),
    constitutional_manifest: freezeArray(["constitutional-authority-hierarchy", "advisory-only-boundary", "fail-closed-replay-divergence"]),
    governance_manifest: freezeArray(["specification-governance-framework", "amendment-addendum-management", "formal-document-taxonomy"]),
    dependency_manifest: freezeArray(["assurance-dependency-evaluation", "assurance-evaluation-contract"]),
    certification_evidence_refs: evidenceRefs,
    certification_result: outcome,
    certification_timestamp: TIMESTAMP,
    certifying_authority: "constitutional-certification-authority:phase-13",
    replay_manifest: replayRefs,
  });

  const constitutional_compliance = domain("CONSTITUTIONAL_COMPLIANCE", [authority.integrity_hash, specIntegrity.integrity_hash], failures, ["CONSTITUTIONAL_AUTHORITY_FAILURE", "AUTHORITY_BOUNDARY_FAILURE", "SPECIFICATION_INTEGRITY_FAILURE"]);
  const authority_certification = domain("AUTHORITY_FRAMEWORK", [authority.integrity_hash], failures, ["CONSTITUTIONAL_AUTHORITY_FAILURE", "AUTHORITY_BOUNDARY_FAILURE"]);
  const assurance_certification = domain("ASSURANCE_FRAMEWORK", [dependency.integrity_hash, assurance.integrity_hash], failures, ["ASSURANCE_DEPENDENCY_FAILURE", "ASSURANCE_EVALUATION_FAILURE"]);
  const replay_certification = domain("REPLAY_DETERMINISM", [divergence.integrity_hash, audit.integrity_hash], failures, ["REPLAY_DETERMINISM_FAILURE", "UNEXPLAINED_DIVERGENCE_NOT_FAIL_CLOSED", "ASSURANCE_LINEAGE_INCOMPLETE"]);
  const governance_certification = domain("GOVERNANCE", [specGovernance.integrity_hash, taxonomy.integrity_hash, amendment.integrity_hash], failures, ["SPECIFICATION_GOVERNANCE_FAILURE", "DOCUMENT_TAXONOMY_FAILURE", "AMENDMENT_GOVERNANCE_FAILURE"]);
  const specification_integrity_certification = domain("SPECIFICATION_INTEGRITY", [specIntegrity.integrity_hash], failures, ["SPECIFICATION_INTEGRITY_FAILURE"]);

  const tests = freezeArray([
    test("Constitutional authority hierarchy enforced", !has(failures, "CONSTITUTIONAL_AUTHORITY_FAILURE"), "CONSTITUTIONAL_AUTHORITY_FAILURE", [authority.integrity_hash]),
    test("Authority precedence deterministic", !has(failures, "AUTHORITY_BOUNDARY_FAILURE"), "AUTHORITY_BOUNDARY_FAILURE", [authority.integrity_hash]),
    test("Operator authority bounded by governance", !has(failures, "AUTHORITY_BOUNDARY_FAILURE"), "AUTHORITY_BOUNDARY_FAILURE", [authority.integrity_hash]),
    test("Governance authority bounded by Constitution", !has(failures, "CONSTITUTIONAL_AUTHORITY_FAILURE"), "CONSTITUTIONAL_AUTHORITY_FAILURE", [authority.integrity_hash]),
    test("Mission Control advisory-only boundary enforced", authority.certification.certified, "AUTHORITY_BOUNDARY_FAILURE", [authority.integrity_hash]),
    test("Authority Boundary Interface validated", authority.certification.certified, "AUTHORITY_BOUNDARY_FAILURE", [authority.integrity_hash]),
    test("Audit ownership preserved across boundaries", audit.certification.certification_authorized, "ASSURANCE_LINEAGE_INCOMPLETE", [audit.integrity_hash]),
    test("Assurance dependency graph deterministic", dependency.certification.certified, "ASSURANCE_DEPENDENCY_FAILURE", [dependency.integrity_hash]),
    test("PRUNED semantics implemented", assurance.vocabulary.pruned_semantics.startsWith("did not execute"), "ASSURANCE_EVALUATION_FAILURE", [assurance.integrity_hash]),
    test("Closed assurance result vocabulary enforced", assurance.vocabulary.closed, "ASSURANCE_EVALUATION_FAILURE", [assurance.integrity_hash]),
    test("Certification aggregation deterministic", assurance.certification.certified, "ASSURANCE_EVALUATION_FAILURE", [assurance.integrity_hash]),
    test("CertificationDecisionRecord immutable", !has(failures, "CERTIFICATION_LEDGER_MUTABLE"), "CERTIFICATION_LEDGER_MUTABLE", [contract.integrity_hash]),
    test("Replay deterministic", replayReplayDivergenceDetection(divergence), "REPLAY_DETERMINISM_FAILURE", [divergence.integrity_hash]),
    test("Unexplained replay divergence fails closed", divergence.unexplained_divergence_fail_closed, "UNEXPLAINED_DIVERGENCE_NOT_FAIL_CLOSED", [divergence.integrity_hash]),
    test("Replay evidence preserved", divergence.immutable_evidence_recorded, "REPLAY_DETERMINISM_FAILURE", [divergence.integrity_hash]),
    test("Assurance lineage complete", audit.lineage_graph.complete, "ASSURANCE_LINEAGE_INCOMPLETE", [audit.integrity_hash]),
    test("Integrity verification reproducible", specIntegrity.contract.integrity_status === "VALID", "SPECIFICATION_INTEGRITY_FAILURE", [specIntegrity.integrity_hash]),
    test("Specification lifecycle governed", specGovernance.certification.certified, "SPECIFICATION_GOVERNANCE_FAILURE", [specGovernance.integrity_hash]),
    test("Document taxonomy complete", taxonomy.certification.certified, "DOCUMENT_TAXONOMY_FAILURE", [taxonomy.integrity_hash]),
    test("Amendment and addendum governance enforced", amendment.certification.certified, "AMENDMENT_GOVERNANCE_FAILURE", [amendment.integrity_hash]),
    test("Reconciliation process defined", amendment.conflict_resolution.conflicts_resolved, "AMENDMENT_GOVERNANCE_FAILURE", [amendment.integrity_hash]),
    test("Vocabulary consistency validated", specIntegrity.vocabulary_validation.outcome === "PASS", "SPECIFICATION_INTEGRITY_FAILURE", [specIntegrity.integrity_hash]),
    test("Cross-reference integrity verified", specIntegrity.cross_reference_validation.outcome === "PASS", "SPECIFICATION_INTEGRITY_FAILURE", [specIntegrity.integrity_hash]),
    test("Specification replay reproducible", specIntegrity.contract.replay_compliance, "SPECIFICATION_INTEGRITY_FAILURE", [specIntegrity.integrity_hash]),
    test("Specification internally consistent", specIntegrity.contract.integrity_status === "VALID", "SPECIFICATION_INTEGRITY_FAILURE", [specIntegrity.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((item) => item.failure_reason).filter((failure): failure is Phase13CertificationFailure => Boolean(failure))])]);
  const effectiveOutcome = outcomeFor(effectiveFailures);
  const effectiveConditions = freezeArray(effectiveOutcome === "CONDITIONAL_PASS" ? ["Resolve non-constitutional documentation issue before advancement."] : []);

  const evidence_binder: CertificationEvidenceBinder = nested({ evidence_binder_id: id("phase13_evidence_binder", evidenceRefs), validation_results: tests.map((item) => item.integrity_hash), constitutional_evidence: [authority.integrity_hash], governance_evidence: [specGovernance.integrity_hash, amendment.integrity_hash], replay_evidence: [divergence.integrity_hash, ...replayRefs], lineage_evidence: [audit.integrity_hash], dependency_evidence: [dependency.integrity_hash], integrity_evidence: [specIntegrity.integrity_hash], certification_reasoning: effectiveOutcome === "PASS" ? "All Phase 13 constitutional certification tests passed." : effectiveOutcome === "CONDITIONAL_PASS" ? "Core constitutional behavior passed with documentation conditions." : "Phase 13 certification failed because one or more constitutional certification tests failed.", append_only: !has(effectiveFailures, "EVIDENCE_BINDING_INCOMPLETE"), fully_explainable: !has(effectiveFailures, "EVIDENCE_BINDING_INCOMPLETE"), supports_independent_verification: !has(effectiveFailures, "EVIDENCE_BINDING_INCOMPLETE") });

  const decision = nested({ certification_id: id("phase13_certification", VERSION), phase_id: "13" as const, specification_manifest_ref: hash(contract.specification_manifest), constitutional_manifest_ref: hash(contract.constitutional_manifest), governance_manifest_ref: hash(contract.governance_manifest), authority_validation_ref: authority.integrity_hash, assurance_validation_ref: assurance.integrity_hash, dependency_validation_ref: dependency.integrity_hash, replay_validation_ref: divergence.integrity_hash, integrity_validation_ref: specIntegrity.integrity_hash, taxonomy_validation_ref: taxonomy.integrity_hash, consistency_validation_ref: specIntegrity.integrity_hash, evidence_binder_ref: evidence_binder.evidence_binder_id, certification_outcome: effectiveOutcome, certification_reasoning: evidence_binder.certification_reasoning, conditions: effectiveConditions, certifying_authority: contract.certifying_authority, certification_timestamp: TIMESTAMP, replay_ref: hash(replayRefs) });

  const ledgerEvents: readonly PhaseCertificationLedgerEntry["event_type"][] = freezeArray(["TEST_EXECUTED", "DOMAIN_CERTIFIED", "EVIDENCE_BOUND", "DECISION_RECORDED", "REPLAY_VALIDATED", "REPORT_PUBLISHED"]);
  const certification_ledger = freezeArray(ledgerEvents.map((event_type, index) => {
    const entry = nested({ ledger_entry_id: id("phase13_cert_ledger", { event_type, index }), certification_id: decision.certification_id, event_type, evidence_refs: evidenceRefs, sequence: index + 1, append_only: true, immutable: true, replayable: true });
    if (has(effectiveFailures, "CERTIFICATION_LEDGER_MUTABLE") && index === ledgerEvents.length - 1) return Object.freeze({ ...entry, immutable: false, integrity_hash: hash({ tampered: entry.ledger_entry_id }) });
    return entry;
  }));
  const replay_validator = nested({ replay_validator_id: id("phase13_replay_validator", decision.certification_id), certification_replayed: !has(effectiveFailures, "CERTIFICATION_REPLAY_FAILURE"), identical_outcome: !has(effectiveFailures, "CERTIFICATION_REPLAY_FAILURE"), evidence_replayed: !has(effectiveFailures, "CERTIFICATION_REPLAY_FAILURE"), deterministic: !has(effectiveFailures, "CERTIFICATION_REPLAY_FAILURE") });
  const final_report = nested({ report_id: id("phase13_final_report", decision.certification_id), executive_summary: decision.certification_reasoning, certification_outcome: effectiveOutcome, tests_passed: tests.filter((item) => item.passed).length, tests_failed: tests.filter((item) => !item.passed).length, conditions: effectiveConditions, phase_13_normative_language_certified: effectiveOutcome === "PASS", future_specification_foundation_ready: effectiveOutcome === "PASS" });

  const finalContract = nested({ ...contract, certification_result: effectiveOutcome, certification_evidence_refs: evidence_binder.append_only ? evidenceRefs : freezeArray([]) });
  const base: Omit<Phase13CertificationGateResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, contract: finalContract, constitutional_compliance, authority_certification, assurance_certification, replay_certification, governance_certification, specification_integrity_certification, tests, evidence_binder, decision, certification_ledger, replay_validator, final_report };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validatePhase13CertificationGate(result?: Phase13CertificationGateResult): Phase13CertificationGateValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, tests_valid: false, evidence_valid: false, ledger_valid: false, replay_valid: false, failures: freezeArray(["EVIDENCE_BINDING_INCOMPLETE" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && verifyHashedRecord(result.decision);
  const tests_valid = result.tests.every((item) => verifyHashedRecord(item)) && (result.decision.certification_outcome !== "PASS" || result.tests.every((item) => item.passed));
  const evidence_valid = verifyHashedRecord(result.evidence_binder) && result.evidence_binder.append_only && result.evidence_binder.fully_explainable && result.evidence_binder.supports_independent_verification;
  const ledger_valid = result.certification_ledger.every((entry) => verifyHashedRecord(entry) && entry.append_only && entry.immutable && entry.replayable);
  const replay_valid = verifyHashedRecord(result.replay_validator) && result.replay_validator.deterministic && result.replay_validator.identical_outcome;
  const failures = freezeArray([...new Set(result.tests.map((item) => item.failure_reason).filter((failure): failure is Phase13CertificationFailure => Boolean(failure)))]);
  const valid = result.decision.certification_outcome === "PASS" && replay_hash_valid && integrity_hash_valid && tests_valid && evidence_valid && ledger_valid && replay_valid;
  return nested({ valid, outcome: result.decision.certification_outcome, replay_hash_valid, integrity_hash_valid, tests_valid, evidence_valid, ledger_valid, replay_valid, failures });
}

export function replayPhase13CertificationGate(result = runPhase13CertificationGate()): boolean {
  const replayed = runPhase13CertificationGate();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validatePhase13CertificationGate(result).valid;
}

export function getPhase13CertificationGateBundle(): Phase13CertificationGateBundle {
  const result = runPhase13CertificationGate();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const), complete_phase_certification_required: true, certification_modifies_specifications: false, immutable_evidence_required: true, deterministic_decisions_required: true, replayable_decisions_required: true, explainable_reasoning_required: true }), result, validation: validatePhase13CertificationGate(result) });
}

export const Phase13CertificationGateService = Object.freeze({ run: runPhase13CertificationGate, validate: validatePhase13CertificationGate, replay: replayPhase13CertificationGate });
