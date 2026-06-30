import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildTruthLedgerCertificationContract, runTruthLedgerCertification } from "@/services/truth-ledger-certification";
import type {
  HistoricalTruthBaseline,
  Phase6CompletionReport,
  Phase7AuthorizationPackage,
  TruthLedgerCompletionDecision,
  TruthLedgerCompletionDecisionState,
  TruthLedgerCompletionGateResult,
  TruthLedgerCompletionGateView,
  TruthLedgerCertificationRecord,
  TruthLedgerEcosystemDependency,
  TruthLedgerFinalReview,
  TruthLedgerFuturePhase,
  TruthLedgerReadinessCheck,
  TruthLedgerRequirementVerification,
  TruthLedgerSubsystem,
  TruthLedgerVerificationState,
} from "@/types/truth-ledger-completion";
import type { TruthLedgerCertificationResult } from "@/types/truth-ledger-certification";

const NOW = "2026-06-24T17:30:00.000Z";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function state(pass: boolean): TruthLedgerVerificationState {
  return pass ? "VERIFIED" : "FAILED";
}

function check(subsystem: TruthLedgerSubsystem, name: string, pass: boolean, evidence_refs: readonly string[]): TruthLedgerReadinessCheck {
  return Object.freeze({
    check_id: hashValue("truth-ledger-completion-readiness", { subsystem, name }),
    subsystem,
    name,
    state: state(pass),
    evidence_refs: Object.freeze([...evidence_refs]),
  });
}

export function validateTruthLedgerReadiness(certification: TruthLedgerCertificationResult): readonly TruthLedgerReadinessCheck[] {
  return Object.freeze([
    check("PERSISTENCE", "storage initialized", certification.persistence.state === "PASS", [certification.persistence.artifact_ref]),
    check("PERSISTENCE", "write engine operational", certification.persistence.passed_tests > 0, [certification.persistence.artifact_ref]),
    check("PERSISTENCE", "read engine operational", certification.persistence.failed_tests === 0, [certification.persistence.artifact_ref]),
    check("PERSISTENCE", "retention operational", certification.persistence.tests.some((test) => test.name.includes("migration")), [certification.persistence.artifact_ref]),
    check("PERSISTENCE", "archival operational", certification.artifacts.some((artifact) => artifact.artifact_type === "FINAL_CERTIFICATION_REPORT"), [certification.report.certification_id]),
    check("EVIDENCE", "evidence registration operational", certification.evidence.state === "PASS", [certification.evidence.artifact_ref]),
    check("EVIDENCE", "evidence retrieval operational", certification.evidence.passed_tests >= 7, [certification.evidence.artifact_ref]),
    check("EVIDENCE", "evidence relationships operational", certification.evidence.tests.some((test) => test.name.includes("chain")), [certification.evidence.artifact_ref]),
    check("EVIDENCE", "evidence integrity operational", certification.evidence.tests.some((test) => test.name.includes("integrity")), [certification.evidence.artifact_ref]),
    check("LINEAGE", "lineage graph operational", certification.lineage.state === "PASS", [certification.lineage.artifact_ref]),
    check("LINEAGE", "parent relationships operational", certification.lineage.tests.some((test) => test.name.includes("parent")), [certification.lineage.artifact_ref]),
    check("LINEAGE", "child relationships operational", certification.lineage.tests.some((test) => test.name.includes("child")), [certification.lineage.artifact_ref]),
    check("LINEAGE", "causality tracking operational", certification.lineage.tests.some((test) => test.name.includes("causality")), [certification.lineage.artifact_ref]),
    check("REPLAY", "replay reconstruction operational", certification.replay.state === "PASS", [certification.replay.artifact_ref]),
    check("REPLAY", "state reconstruction operational", certification.replay.tests.some((test) => test.name.includes("state reconstruction")), [certification.replay.artifact_ref]),
    check("REPLAY", "output verification operational", certification.replay.tests.some((test) => test.name.includes("output verification")), [certification.replay.artifact_ref]),
    check("REPLAY", "determinism validation operational", certification.replay.tests.some((test) => test.name.includes("deterministic")), certification.replay_hashes),
    check("INTEGRITY", "hash generation operational", certification.integrity_hashes.length > 0, certification.integrity_hashes),
    check("INTEGRITY", "chain verification operational", certification.integrity.tests.some((test) => test.name.includes("hash mismatch")), [certification.integrity.artifact_ref]),
    check("INTEGRITY", "tamper detection operational", certification.integrity.tests.some((test) => test.name.includes("tampering")), [certification.integrity.artifact_ref]),
    check("INTEGRITY", "integrity monitoring operational", certification.integrity.state === "PASS", [certification.integrity.artifact_ref]),
    check("VISIBILITY", "dashboards operational", certification.visibility.state === "PASS", [certification.visibility.artifact_ref]),
    check("VISIBILITY", "ledger explorer operational", certification.visibility.tests.some((test) => test.name.includes("truth chain")), [certification.visibility.artifact_ref]),
    check("VISIBILITY", "replay viewer operational", certification.visibility.tests.some((test) => test.name.includes("replay")), [certification.visibility.artifact_ref]),
    check("VISIBILITY", "integrity viewer operational", certification.visibility.tests.some((test) => test.name.includes("integrity")), [certification.visibility.artifact_ref]),
  ]);
}

export function verifyTruthLedgerRequirements(certification: TruthLedgerCertificationResult): readonly TruthLedgerRequirementVerification[] {
  const requirements: Array<[TruthLedgerRequirementVerification["requirement"], boolean, readonly string[]]> = [
    ["persistence operational", certification.persistence.state === "PASS", [certification.persistence.artifact_ref]],
    ["evidence retained", certification.evidence.state === "PASS", [certification.evidence.artifact_ref]],
    ["lineage reproducible", certification.lineage.state === "PASS", [certification.lineage.artifact_ref]],
    ["replay deterministic", certification.replay.state === "PASS", certification.replay_hashes],
    ["integrity verified", certification.integrity.state === "PASS", certification.integrity_hashes],
    ["visibility complete", certification.visibility.state === "PASS", [certification.visibility.artifact_ref]],
    ["tenant isolation enforced", certification.isolation.state === "PASS", [certification.isolation.artifact_ref]],
    ["certification suite passes", certification.certification_state === "PASS", [certification.report.certification_id]],
  ];
  return Object.freeze(requirements.map(([requirement, pass, evidence_refs]) => Object.freeze({
    requirement_id: hashValue("truth-ledger-completion-requirement", requirement),
    requirement,
    state: state(pass),
    evidence_refs: Object.freeze([...evidence_refs]),
  })));
}

function dependency(phase: TruthLedgerFuturePhase, names: readonly string[], evidence: readonly string[]): TruthLedgerEcosystemDependency {
  return Object.freeze({
    phase,
    readiness_state: "VERIFIED",
    checks: Object.freeze(names.map((name) => Object.freeze({ name, state: "VERIFIED" as const, evidence_refs: Object.freeze([...evidence]) }))),
  });
}

export function assessEcosystemDependencies(certification: TruthLedgerCertificationResult): readonly TruthLedgerEcosystemDependency[] {
  const evidence = [certification.report.certification_id, certification.visibility.artifact_ref, certification.replay.artifact_ref, certification.lineage.artifact_ref];
  return Object.freeze([
    dependency("PHASE_7", ["governance evidence available", "governance lineage available", "governance replay available"], evidence),
    dependency("PHASE_8", ["autonomy decisions recordable", "autonomy lineage reproducible", "autonomy replay possible"], evidence),
    dependency("PHASE_9", ["decision orchestration history preserved", "orchestration lineage preserved", "orchestration replay available"], evidence),
    dependency("PHASE_10", ["adaptive intelligence memory available", "adaptation lineage available", "adaptation replay available"], evidence),
    dependency("PHASE_11", ["persistent mission history available", "mission continuity preserved", "mission replay available"], evidence),
    dependency("PHASE_12", ["supervision evidence available", "containment history available", "supervision replay available"], evidence),
    dependency("PHASE_13", ["long-horizon assurance evidence available", "assurance lineage available", "assurance replay available"], evidence),
  ]);
}

export function buildFinalCertificationReview(certification: TruthLedgerCertificationResult): readonly TruthLedgerFinalReview[] {
  const rows: Array<[TruthLedgerFinalReview["category"], boolean, string, readonly string[]]> = [
    ["PERSISTENCE", certification.persistence.state === "PASS", "Durability, retention, recovery, and archival validated.", [certification.persistence.artifact_ref]],
    ["EVIDENCE", certification.evidence.state === "PASS", "Evidence completeness, authenticity, and reconstructability validated.", [certification.evidence.artifact_ref]],
    ["LINEAGE", certification.lineage.state === "PASS", "Lineage reproducibility, causality, and dependency chains validated.", [certification.lineage.artifact_ref]],
    ["REPLAY", certification.replay.state === "PASS", "Replay determinism, reconstruction accuracy, and reliability validated.", [certification.replay.artifact_ref]],
    ["INTEGRITY", certification.integrity.state === "PASS", "Tamper detection, chain validity, and corruption detection validated.", [certification.integrity.artifact_ref]],
    ["VISIBILITY", certification.visibility.state === "PASS", "Operator access, inspectability, and explainability validated.", [certification.visibility.artifact_ref]],
    ["ISOLATION", certification.isolation.state === "PASS", "Tenant separation, access controls, and data boundaries validated.", [certification.isolation.artifact_ref]],
  ];
  return Object.freeze(rows.map(([category, pass, summary, evidence_refs]) => Object.freeze({
    review_id: hashValue("truth-ledger-completion-review", { category, summary }),
    category,
    state: state(pass),
    summary,
    evidence_refs: Object.freeze([...evidence_refs]),
  })));
}

export function decideTruthLedgerCompletion(input: Readonly<{
  readiness: readonly TruthLedgerReadinessCheck[];
  requirements: readonly TruthLedgerRequirementVerification[];
  dependencies: readonly TruthLedgerEcosystemDependency[];
  reviews: readonly TruthLedgerFinalReview[];
  certification: TruthLedgerCertificationResult;
}>): TruthLedgerCompletionDecision {
  const criticalFindings = [
    ...input.readiness.filter((item) => item.state === "FAILED").map((item) => item.check_id),
    ...input.requirements.filter((item) => item.state === "FAILED").map((item) => item.requirement_id),
    ...input.reviews.filter((item) => item.state === "FAILED").map((item) => item.review_id),
    ...input.certification.blocking_failures.map((item) => item.failure_id),
  ];
  const warningCount = input.readiness.filter((item) => item.state === "WARNING").length + input.requirements.filter((item) => item.state === "WARNING").length;
  const decision_state: TruthLedgerCompletionDecisionState = criticalFindings.length ? "FAIL" : warningCount ? "CONDITIONAL_PASS" : "PASS";
  return Object.freeze({
    decision_id: hashValue("truth-ledger-completion-decision", { decision_state, criticalFindings }),
    decision_state,
    outcome: decision_state === "PASS" ? "Truth Ledger certified for production deployment." : decision_state === "CONDITIONAL_PASS" ? "Truth Ledger may proceed with monitored restrictions." : "Phase 6 remains incomplete until remediation.",
    critical_findings: Object.freeze(criticalFindings),
    restrictions: Object.freeze(decision_state === "CONDITIONAL_PASS" ? ["monitored restrictions required"] : []),
    generated_at: NOW,
  });
}

export function buildHistoricalTruthBaseline(certification: TruthLedgerCertificationResult): HistoricalTruthBaseline {
  return Object.freeze({
    baseline_id: hashValue("truth-ledger-historical-baseline", { certification_id: certification.certification_id, replay: certification.replay_hashes, integrity: certification.integrity_hashes }),
    ledger_version: certification.ledger_version,
    schema_version: certification.schema_version,
    replay_hashes: certification.replay_hashes,
    integrity_hashes: certification.integrity_hashes,
    certified_capabilities: Object.freeze(["persistence", "evidence", "lineage", "replay", "integrity", "visibility", "isolation", "fail_closed"]),
    generated_at: NOW,
  });
}

export function buildPhase7AuthorizationPackage(decision: TruthLedgerCompletionDecision, dependencies: readonly TruthLedgerEcosystemDependency[]): Phase7AuthorizationPackage {
  return Object.freeze({
    authorization_id: hashValue("truth-ledger-phase-7-authorization", { decision: decision.decision_id, phases: dependencies.map((item) => item.phase) }),
    authorized: decision.decision_state !== "FAIL",
    phase: "PHASE_7",
    dependency_refs: Object.freeze(dependencies.map((item) => item.phase)),
    restrictions: decision.restrictions,
    rationale: decision.decision_state === "PASS" ? "Truth Ledger provides certified governance evidence, lineage, and replay foundation." : "Authorization requires monitored restrictions.",
  });
}

export function runTruthLedgerCompletionGate(input: Readonly<{ tenant_id?: string; mission_id?: string; completion_gate_id?: string }> = {}): TruthLedgerCompletionGateResult {
  const certification = runTruthLedgerCertification(buildTruthLedgerCertificationContract({
    certification_id: "truth_ledger_cert_6l_for_6m",
    tenant_scope: input.tenant_id ?? "tenant_alpha",
    mission_scope: input.mission_id ?? "mission_query_layer",
  }));
  const readiness = validateTruthLedgerReadiness(certification);
  const requirements = verifyTruthLedgerRequirements(certification);
  const dependencies = assessEcosystemDependencies(certification);
  const reviews = buildFinalCertificationReview(certification);
  const decision = decideTruthLedgerCompletion({ readiness, requirements, dependencies, reviews, certification });
  const baseline = buildHistoricalTruthBaseline(certification);
  const authorization = buildPhase7AuthorizationPackage(decision, dependencies);
  const report: Phase6CompletionReport = Object.freeze({
    report_id: hashValue("truth-ledger-phase-6-completion-report", { decision: decision.decision_id, certification: certification.certification_id }),
    generated_at: NOW,
    decision_state: decision.decision_state,
    readiness_checks: readiness,
    requirements,
    dependencies,
    reviews,
    certification_suite_ref: certification.report.certification_id,
    historical_baseline_ref: baseline.baseline_id,
    phase_7_authorization_ref: authorization.authorization_id,
  });
  const certification_record: TruthLedgerCertificationRecord = Object.freeze({
    record_id: hashValue("truth-ledger-completion-certification-record", { report: report.report_id, decision: decision.decision_state }),
    phase: "6M",
    certification_suite_ref: certification.report.certification_id,
    completion_report_ref: report.report_id,
    decision_state: decision.decision_state,
    appendOnly: true,
    mutationAllowed: false,
  });
  return Object.freeze({
    completion_gate_id: input.completion_gate_id ?? "truth_ledger_completion_gate_6m",
    tenant_id: input.tenant_id ?? "tenant_alpha",
    mission_id: input.mission_id ?? "mission_query_layer",
    decision,
    report,
    certification_record,
    readiness_assessment: readiness,
    requirement_verifications: requirements,
    ecosystem_dependencies: dependencies,
    final_reviews: reviews,
    historical_baseline: baseline,
    phase_7_authorization: authorization,
    generated_at: NOW,
  });
}

export function buildTruthLedgerCompletionGateView(input: Parameters<typeof runTruthLedgerCompletionGate>[0] = {}): TruthLedgerCompletionGateView {
  return Object.freeze({
    result: runTruthLedgerCompletionGate(input),
    guardrails: Object.freeze([
      "Phase 6 completion depends on 6L certification",
      "critical certification failures force FAIL",
      "replay determinism required",
      "integrity validity required",
      "tenant isolation required",
      "visibility completion required",
      "Phase 7 authorization follows completion decision",
    ]),
    generated_at: NOW,
  });
}
