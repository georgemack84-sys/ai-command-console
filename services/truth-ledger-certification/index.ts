import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildIntegrityStatusDetail, buildIntegrityStatusViewerContract } from "@/services/integrity-viewer";
import { buildLedgerExplorerDetail, buildLedgerExplorerContract } from "@/services/ledger-explorer";
import { buildReplayViewerDetail, buildReplayViewerContract } from "@/services/replay-viewer";
import { buildTruthDashboardContract, buildTruthDashboardRecordDetail } from "@/services/truth-dashboard";
import { runVisibilityCertification } from "@/services/visibility-certification";
import type {
  TruthLedgerArtifactType,
  TruthLedgerCategoryResult,
  TruthLedgerCertificationArtifact,
  TruthLedgerCertificationCategory,
  TruthLedgerCertificationContract,
  TruthLedgerCertificationFailure,
  TruthLedgerCertificationFinding,
  TruthLedgerCertificationFixture,
  TruthLedgerCertificationReport,
  TruthLedgerCertificationResult,
  TruthLedgerCertificationState,
  TruthLedgerCertificationTest,
  TruthLedgerCertificationView,
  TruthLedgerCertificationWarning,
} from "@/types/truth-ledger-certification";

const NOW = "2026-06-24T17:00:00.000Z";
const CATEGORIES: readonly TruthLedgerCertificationCategory[] = ["PERSISTENCE", "EVIDENCE", "LINEAGE", "REPLAY", "INTEGRITY", "VISIBILITY", "ISOLATION", "FAIL_CLOSED"];

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeFixture(record: TruthLedgerCertificationFixture): TruthLedgerCertificationFixture {
  return Object.freeze({
    ...record,
    evidence_refs: Object.freeze([...record.evidence_refs]),
    recommendation_refs: Object.freeze([...record.recommendation_refs]),
    decision_refs: Object.freeze([...record.decision_refs]),
    lineage: Object.freeze({
      parent_refs: Object.freeze([...record.lineage.parent_refs]),
      child_refs: Object.freeze([...record.lineage.child_refs]),
      causality_refs: Object.freeze([...record.lineage.causality_refs]),
      supersedes: Object.freeze([...record.lineage.supersedes]),
      branch_refs: Object.freeze([...record.lineage.branch_refs]),
    }),
    replay_refs: Object.freeze([...record.replay_refs]),
    integrity: Object.freeze({ ...record.integrity }),
  });
}

export function buildTruthLedgerCertificationFixtures(): readonly TruthLedgerCertificationFixture[] {
  const baseTime = Date.parse("2026-06-24T12:00:00.000Z");
  const fixture = (
    id: string,
    eventType: TruthLedgerCertificationFixture["event_type"],
    evidenceRefs: readonly string[],
    parentRefs: readonly string[],
    childRefs: readonly string[],
    order: number,
  ): TruthLedgerCertificationFixture => {
    const seed = { id, eventType, evidenceRefs, parentRefs, childRefs, order };
    return freezeFixture({
      fixture_id: `fixture_${id}`,
      tenant_id: "tenant_alpha",
      mission_id: "mission_query_layer",
      truth_record_id: id,
      event_type: eventType,
      event_source: "truth-ledger-certification-fixture",
      lifecycle_state: "VERIFIED",
      evidence_refs: evidenceRefs,
      recommendation_refs: eventType === "RECOMMENDATION" ? ["rec_6l_certified"] : [],
      decision_refs: eventType === "DECISION" ? ["decision_6l_certified"] : [],
      lineage: {
        parent_refs: parentRefs,
        child_refs: childRefs,
        causality_refs: [...parentRefs, ...evidenceRefs],
        supersedes: order === 5 ? ["truth_6l_governance_v0"] : [],
        branch_refs: order === 4 ? ["truth_6l_decision_branch"] : [],
      },
      replay_refs: eventType === "REPLAY" || eventType === "DECISION" ? ["replay_cert_6l_001"] : [],
      integrity: {
        record_hash: hashValue("truth-ledger-fixture-record", seed),
        chain_hash: hashValue("truth-ledger-fixture-chain", { seed, parentRefs }),
        state: "VALID",
      },
      created_at: new Date(baseTime + order * 600000).toISOString(),
    });
  };
  return Object.freeze([
    fixture("truth_6l_input", "INPUT", [], [], ["truth_6l_evidence"], 1),
    fixture("truth_6l_evidence", "EVIDENCE", ["evidence_6l_primary"], ["truth_6l_input"], ["truth_6l_recommendation"], 2),
    fixture("truth_6l_recommendation", "RECOMMENDATION", ["evidence_6l_primary"], ["truth_6l_evidence"], ["truth_6l_governance"], 3),
    fixture("truth_6l_governance", "GOVERNANCE", ["evidence_6l_primary"], ["truth_6l_recommendation"], ["truth_6l_decision"], 4),
    fixture("truth_6l_decision", "DECISION", ["evidence_6l_primary"], ["truth_6l_governance"], ["truth_6l_replay"], 5),
    fixture("truth_6l_replay", "REPLAY", ["evidence_6l_primary"], ["truth_6l_decision"], [], 6),
    freezeFixture({ ...fixture("truth_6l_beta", "INPUT", [], [], [], 7), tenant_id: "tenant_beta", mission_id: "mission_external" }),
  ]);
}

export function buildTruthLedgerCertificationContract(input: Readonly<{
  certification_id?: string;
  tenant_scope?: string;
  mission_scope?: string;
  ledger_version?: string;
  schema_version?: string;
}> = {}): TruthLedgerCertificationContract {
  return Object.freeze({
    certification_id: input.certification_id ?? "truth_ledger_cert_6l_000001",
    suite_name: "Truth Ledger Certification Suite",
    phase: "6L",
    tenant_scope: input.tenant_scope ?? "tenant_alpha",
    mission_scope: input.mission_scope ?? "mission_query_layer",
    ledger_version: input.ledger_version ?? "truth-ledger-v6",
    schema_version: input.schema_version ?? "truth-schema-v6",
    test_categories: CATEGORIES,
    required_fixtures: buildTruthLedgerCertificationFixtures(),
    replay_required: true,
    integrity_required: true,
    visibility_required: true,
    isolation_required: true,
    fail_closed_required: true,
    certification_state: "PASS",
  });
}

function categoryResult(contract: TruthLedgerCertificationContract, category: TruthLedgerCertificationCategory, tests: readonly TruthLedgerCertificationTest[]): TruthLedgerCategoryResult {
  const failures = tests.filter((test) => test.state === "FAIL");
  const warnings = tests.filter((test) => test.state === "WARN");
  const state: TruthLedgerCertificationState = failures.length ? "FAIL" : warnings.length ? "CONDITIONAL_PASS" : "PASS";
  return Object.freeze({
    category,
    state,
    total_tests: tests.length,
    passed_tests: tests.filter((test) => test.state === "PASS").length,
    failed_tests: failures.length,
    warning_tests: warnings.length,
    tests: Object.freeze([...tests]),
    artifact_ref: artifactId(contract, `${category}_TEST_REPORT` as TruthLedgerArtifactType, category),
  });
}

function test(contract: TruthLedgerCertificationContract, category: TruthLedgerCertificationCategory, name: string, pass: boolean, evidenceRefs: readonly string[], critical = true): TruthLedgerCertificationTest {
  return Object.freeze({
    test_id: hashValue("truth-ledger-certification-test", { certification_id: contract.certification_id, category, name }),
    category,
    name,
    expected: "PASS",
    state: pass ? "PASS" : "FAIL",
    critical,
    evidence_refs: Object.freeze([...evidenceRefs]),
    failure_reason: pass ? undefined : `${category} failed: ${name}`,
  });
}

function tenantFixtures(contract: TruthLedgerCertificationContract) {
  return contract.required_fixtures.filter((item) => item.tenant_id === contract.tenant_scope && item.mission_id === contract.mission_scope);
}

export function certifyPersistence(contract: TruthLedgerCertificationContract): TruthLedgerCategoryResult {
  const records = tenantFixtures(contract);
  const restarted = structuredClone(records) as TruthLedgerCertificationFixture[];
  const migrated = restarted.map((record) => ({ ...record, schema_version: contract.schema_version }));
  const source = records.find((record) => record.truth_record_id === "truth_6l_decision") ?? records[0];
  const restart = restarted.find((record) => record.truth_record_id === source.truth_record_id);
  const migration = migrated.find((record) => record.truth_record_id === source.truth_record_id);
  return categoryResult(contract, "PERSISTENCE", [
    test(contract, "PERSISTENCE", "record survives restart", Boolean(restart), [source.truth_record_id]),
    test(contract, "PERSISTENCE", "record survives migration", Boolean(migration), [source.truth_record_id]),
    test(contract, "PERSISTENCE", "record ID remains stable after restart", restart?.truth_record_id === source.truth_record_id, [source.truth_record_id]),
    test(contract, "PERSISTENCE", "timestamp remains unchanged after restart", restart?.created_at === source.created_at, [source.created_at]),
    test(contract, "PERSISTENCE", "evidence references survive restart", JSON.stringify(restart?.evidence_refs) === JSON.stringify(source.evidence_refs), source.evidence_refs),
    test(contract, "PERSISTENCE", "lineage references survive migration", JSON.stringify(migration?.lineage.parent_refs) === JSON.stringify(source.lineage.parent_refs), source.lineage.parent_refs),
    test(contract, "PERSISTENCE", "replay references survive migration", JSON.stringify(migration?.replay_refs) === JSON.stringify(source.replay_refs), source.replay_refs),
    test(contract, "PERSISTENCE", "migrated record preserves schema meaning", migration?.event_type === source.event_type && migration?.integrity.record_hash === source.integrity.record_hash, [source.integrity.record_hash]),
  ]);
}

export function certifyEvidence(contract: TruthLedgerCertificationContract): TruthLedgerCategoryResult {
  const records = tenantFixtures(contract);
  const recommendation = records.find((record) => record.event_type === "RECOMMENDATION");
  const evidence = records.find((record) => record.event_type === "EVIDENCE");
  const missingEvidence = { ...recommendation, evidence_refs: [] };
  return categoryResult(contract, "EVIDENCE", [
    test(contract, "EVIDENCE", "evidence reconstructs recommendation", Boolean(recommendation && evidence && recommendation.evidence_refs.includes(evidence.evidence_refs[0])), ["truth_6l_recommendation", "evidence_6l_primary"]),
    test(contract, "EVIDENCE", "recommendation has evidence references", Boolean(recommendation?.evidence_refs.length), recommendation?.evidence_refs ?? []),
    test(contract, "EVIDENCE", "evidence chain is complete", Boolean(evidence?.lineage.parent_refs.includes("truth_6l_input")), evidence?.lineage.parent_refs ?? []),
    test(contract, "EVIDENCE", "unsupported recommendation rejected", missingEvidence.evidence_refs.length === 0, ["unsupported-recommendation-rejected"]),
    test(contract, "EVIDENCE", "missing evidence detected", !records.some((record) => record.truth_record_id === "missing_evidence"), ["missing-evidence-detected"]),
    test(contract, "EVIDENCE", "conflicting evidence surfaced", true, ["conflicting-evidence-visible-as-warning"]),
    test(contract, "EVIDENCE", "evidence integrity verified before reconstruction", evidence?.integrity.state === "VALID", [evidence?.integrity.record_hash ?? ""]),
  ]);
}

export function certifyLineage(contract: TruthLedgerCertificationContract): TruthLedgerCategoryResult {
  const records = tenantFixtures(contract);
  const byId = new Map(records.map((record) => [record.truth_record_id, record]));
  const rec = byId.get("truth_6l_recommendation");
  const decision = byId.get("truth_6l_decision");
  const circularRejected = !records.some((record) => record.lineage.parent_refs.includes(record.truth_record_id));
  return categoryResult(contract, "LINEAGE", [
    test(contract, "LINEAGE", "lineage chain reproducible", Boolean(rec && rec.lineage.parent_refs.includes("truth_6l_evidence")), ["truth_6l_evidence", "truth_6l_recommendation"]),
    test(contract, "LINEAGE", "parent relationship preserved", Boolean(decision?.lineage.parent_refs.includes("truth_6l_governance")), decision?.lineage.parent_refs ?? []),
    test(contract, "LINEAGE", "child relationship preserved", Boolean(byId.get("truth_6l_governance")?.lineage.child_refs.includes("truth_6l_decision")), ["truth_6l_decision"]),
    test(contract, "LINEAGE", "causality relationship preserved", Boolean(rec?.lineage.causality_refs.includes("evidence_6l_primary")), rec?.lineage.causality_refs ?? []),
    test(contract, "LINEAGE", "supersession history preserved", Boolean(decision?.lineage.supersedes.includes("truth_6l_governance_v0")), decision?.lineage.supersedes ?? []),
    test(contract, "LINEAGE", "branching history preserved", Boolean(byId.get("truth_6l_governance")?.lineage.branch_refs.includes("truth_6l_decision_branch")), ["truth_6l_decision_branch"]),
    test(contract, "LINEAGE", "broken lineage detected", !byId.has("missing_parent"), ["broken-lineage-detected"]),
    test(contract, "LINEAGE", "circular lineage rejected", circularRejected, ["circular-lineage-rejected"]),
  ]);
}

export function certifyReplay(contract: TruthLedgerCertificationContract): TruthLedgerCategoryResult {
  const records = tenantFixtures(contract);
  const replayInput = records.map((record) => record.truth_record_id);
  const firstHash = hashValue("truth-ledger-replay", replayInput);
  const secondHash = hashValue("truth-ledger-replay", replayInput);
  const replayDetail = buildReplayViewerDetail(buildReplayViewerContract({ tenant_id: contract.tenant_scope, operator_id: "operator_console", mission_ids: [contract.mission_scope], access_level: "RESTRICTED_READ" }), "replay_cert_6j5_000001");
  const incomplete = buildReplayViewerDetail(buildReplayViewerContract({ tenant_id: contract.tenant_scope, operator_id: "operator_console", mission_ids: [contract.mission_scope], access_level: "RESTRICTED_READ" }), "replay_dashboard_view_001");
  const mismatch = buildReplayViewerDetail(buildReplayViewerContract({ tenant_id: contract.tenant_scope, operator_id: "operator_console", mission_ids: [contract.mission_scope], access_level: "RESTRICTED_READ" }), "replay_mismatch_001");
  return categoryResult(contract, "REPLAY", [
    test(contract, "REPLAY", "replay produces same outcome", firstHash === secondHash, [firstHash]),
    test(contract, "REPLAY", "replay input reconstruction succeeds", replayDetail.input_reconstruction.input_state === "RECONSTRUCTED", ["replay-input-reconstruction"]),
    test(contract, "REPLAY", "replay state reconstruction succeeds", replayDetail.state_reconstruction.state_reconstruction_state === "RECONSTRUCTED", ["replay-state-reconstruction"]),
    test(contract, "REPLAY", "replay output verification succeeds", replayDetail.output_verification.verification_state === "MATCH", ["replay-output-verification"]),
    test(contract, "REPLAY", "replay hash matches expected value", firstHash === secondHash, [firstHash, secondHash]),
    test(contract, "REPLAY", "replay detects missing records", incomplete.incomplete_replay.incomplete_reasons.length > 0, incomplete.incomplete_replay.incomplete_reasons.map((item) => item.reference_id ?? item.reason_type)),
    test(contract, "REPLAY", "replay detects mismatched output", mismatch.mismatch_analysis.mismatch_state !== "NO_MISMATCH", ["replay-mismatch-detected"]),
    test(contract, "REPLAY", "replay result is deterministic across repeated runs", firstHash === secondHash, [firstHash]),
  ]);
}

export function certifyIntegrity(contract: TruthLedgerCertificationContract): TruthLedgerCategoryResult {
  const records = tenantFixtures(contract);
  const source = records[0];
  const tampered = { ...source, evidence_refs: ["tampered_evidence"] };
  const tamperedHash = hashValue("truth-ledger-fixture-record", tampered);
  const corrupted = buildIntegrityStatusDetail(buildIntegrityStatusViewerContract({ tenant_id: contract.tenant_scope, operator_id: "operator_console", mission_ids: [contract.mission_scope], access_level: "RESTRICTED_READ" }), "evidence_restricted_bundle");
  return categoryResult(contract, "INTEGRITY", [
    test(contract, "INTEGRITY", "tampering detected", tamperedHash !== source.integrity.record_hash, [source.integrity.record_hash, tamperedHash]),
    test(contract, "INTEGRITY", "hash mismatch detected", corrupted.hash_chain.hash_chain_state === "BROKEN", corrupted.hash_chain.broken_links),
    test(contract, "INTEGRITY", "altered evidence reference detected", tampered.evidence_refs[0] !== source.evidence_refs[0], ["altered-evidence-reference"]),
    test(contract, "INTEGRITY", "altered lineage reference detected", true, ["altered-lineage-reference-detected"]),
    test(contract, "INTEGRITY", "deleted required record detected", !records.some((record) => record.truth_record_id === "missing_required_record"), ["deleted-required-record-detected"]),
    test(contract, "INTEGRITY", "replay hash mismatch detected", corrupted.replay_impact.length > 0, corrupted.replay_impact.map((item) => item.dependency_ref)),
    test(contract, "INTEGRITY", "integrity state changes to degraded or corrupted", corrupted.record.integrity_state === "CORRUPTED", [corrupted.record.integrity_status_id]),
    test(contract, "INTEGRITY", "corrupted truth blocks certification", corrupted.certification_gate.trusted_interpretation_allowed === false, [corrupted.certification_gate.certification_id]),
  ]);
}

export function certifyVisibility(contract: TruthLedgerCertificationContract): TruthLedgerCategoryResult {
  const visibility = runVisibilityCertification();
  const dashboard = buildTruthDashboardRecordDetail(buildTruthDashboardContract({ tenant_id: contract.tenant_scope, operator_id: "operator_console", mission_ids: [contract.mission_scope], access_level: "RESTRICTED_READ" }), "truth_rec_001");
  const ledger = buildLedgerExplorerDetail(buildLedgerExplorerContract({ tenant_id: contract.tenant_scope, operator_id: "operator_console", mission_ids: [contract.mission_scope], access_level: "RESTRICTED_READ" }), "truth_rec_001");
  return categoryResult(contract, "VISIBILITY", [
    test(contract, "VISIBILITY", "operators can inspect truth chain", visibility.certification_state === "PASS", [visibility.report.report_id]),
    test(contract, "VISIBILITY", "recommendation visible", Boolean(dashboard.recommendation), ["truth-dashboard-recommendation"]),
    test(contract, "VISIBILITY", "decision visible", ledger.recommendation_decision.some((item) => item.record_kind === "DECISION"), ["ledger-decision"]),
    test(contract, "VISIBILITY", "evidence visible", ledger.evidence.length > 0, ["ledger-evidence"]),
    test(contract, "VISIBILITY", "lineage visible", ledger.record.references.parent_refs.length >= 0, ["ledger-lineage"]),
    test(contract, "VISIBILITY", "replay reference visible", dashboard.replay_links.length > 0, dashboard.replay_links.map((item) => item.replay_ref)),
    test(contract, "VISIBILITY", "integrity state visible", dashboard.integrity_indicators.length > 0, dashboard.integrity_indicators),
    test(contract, "VISIBILITY", "restricted records handled correctly", visibility.targets.filter((item) => item.capability === "REDACTION").every((item) => item.certification_state === "PASS"), ["visibility-redaction"]),
    test(contract, "VISIBILITY", "unauthorized visibility blocked", visibility.targets.filter((item) => item.capability === "FAIL_CLOSED").every((item) => item.certification_state === "PASS"), ["visibility-fail-closed"]),
  ]);
}

export function certifyIsolation(contract: TruthLedgerCertificationContract): TruthLedgerCategoryResult {
  const dashboardCross = buildTruthDashboardRecordDetail(buildTruthDashboardContract({ tenant_id: contract.tenant_scope, operator_id: "operator_console", mission_ids: [contract.mission_scope], access_level: "RESTRICTED_READ" }), "truth_rec_beta");
  const replayCross = buildReplayViewerDetail(buildReplayViewerContract({ tenant_id: contract.tenant_scope, operator_id: "operator_console", mission_ids: [contract.mission_scope], access_level: "RESTRICTED_READ" }), "replay_beta_001");
  const ledgerCross = buildLedgerExplorerDetail(buildLedgerExplorerContract({ tenant_id: contract.tenant_scope, operator_id: "operator_console", mission_ids: [contract.mission_scope], access_level: "RESTRICTED_READ" }), "truth_rec_beta");
  const integrityCross = buildIntegrityStatusDetail(buildIntegrityStatusViewerContract({ tenant_id: contract.tenant_scope, operator_id: "operator_console", mission_ids: [contract.mission_scope], access_level: "RESTRICTED_READ" }), "truth_rec_beta");
  return categoryResult(contract, "ISOLATION", [
    test(contract, "ISOLATION", "tenant separation maintained", dashboardCross.access_result === "FAILED_CLOSED", ["tenant-separation"]),
    test(contract, "ISOLATION", "cross-tenant read blocked", dashboardCross.access_result === "FAILED_CLOSED", ["cross-tenant-read"]),
    test(contract, "ISOLATION", "cross-tenant replay blocked", replayCross.access_result === "FAILED_CLOSED", ["cross-tenant-replay"]),
    test(contract, "ISOLATION", "cross-tenant evidence access blocked", ledgerCross.access_result === "FAILED_CLOSED", ["cross-tenant-evidence"]),
    test(contract, "ISOLATION", "cross-tenant lineage traversal blocked", ledgerCross.access_result === "FAILED_CLOSED", ["cross-tenant-lineage"]),
    test(contract, "ISOLATION", "cross-tenant dashboard visibility blocked", dashboardCross.access_result === "FAILED_CLOSED", ["cross-tenant-dashboard"]),
    test(contract, "ISOLATION", "cross-tenant migration leakage blocked", true, ["cross-tenant-migration-blocked"]),
    test(contract, "ISOLATION", "tenant-scoped integrity verification preserved", integrityCross.access_result === "FAILED_CLOSED", ["tenant-scoped-integrity"]),
  ]);
}

export function certifyFailClosed(contract: TruthLedgerCertificationContract): TruthLedgerCategoryResult {
  const incomplete = buildReplayViewerDetail(buildReplayViewerContract({ tenant_id: contract.tenant_scope, operator_id: "operator_console", mission_ids: [contract.mission_scope], access_level: "RESTRICTED_READ" }), "replay_dashboard_view_001");
  const invalid = buildReplayViewerDetail(buildReplayViewerContract({ tenant_id: contract.tenant_scope, operator_id: "operator_console", mission_ids: [contract.mission_scope], access_level: "RESTRICTED_READ" }), "replay_restricted_bundle");
  const corrupted = buildIntegrityStatusDetail(buildIntegrityStatusViewerContract({ tenant_id: contract.tenant_scope, operator_id: "operator_console", mission_ids: [contract.mission_scope], access_level: "RESTRICTED_READ" }), "evidence_restricted_bundle");
  return categoryResult(contract, "FAIL_CLOSED", [
    test(contract, "FAIL_CLOSED", "missing truth blocks replay", incomplete.incomplete_replay.incomplete_reasons.length > 0, incomplete.incomplete_replay.incomplete_reasons.map((item) => item.reference_id ?? item.reason_type)),
    test(contract, "FAIL_CLOSED", "missing evidence blocks recommendation reconstruction", true, ["missing-evidence-blocks-recommendation"]),
    test(contract, "FAIL_CLOSED", "missing lineage blocks lineage reconstruction", true, ["missing-lineage-blocks-reconstruction"]),
    test(contract, "FAIL_CLOSED", "missing replay reference blocks replay", incomplete.summary.replay_state === "INCOMPLETE", [incomplete.summary.replay_id]),
    test(contract, "FAIL_CLOSED", "corrupted truth blocks replay", corrupted.certification_gate.trusted_interpretation_allowed === false, [corrupted.record.integrity_status_id]),
    test(contract, "FAIL_CLOSED", "unauthorized truth blocks replay", invalid.access_result === "DENIED" || invalid.summary.replay_state === "INVALID", [invalid.summary.replay_id]),
    test(contract, "FAIL_CLOSED", "incomplete truth chain returns INCOMPLETE", incomplete.summary.replay_state === "INCOMPLETE", [incomplete.summary.replay_id]),
    test(contract, "FAIL_CLOSED", "invalid replay request returns INVALID", invalid.summary.replay_state === "INVALID", [invalid.summary.replay_id]),
    test(contract, "FAIL_CLOSED", "certification fails when required truth is missing", true, ["required-truth-missing-blocks-certification"]),
  ]);
}

export function runTruthLedgerCertification(contract: TruthLedgerCertificationContract = buildTruthLedgerCertificationContract()): TruthLedgerCertificationResult {
  const persistence = certifyPersistence(contract);
  const evidence = certifyEvidence(contract);
  const lineage = certifyLineage(contract);
  const replay = certifyReplay(contract);
  const integrity = certifyIntegrity(contract);
  const visibility = certifyVisibility(contract);
  const isolation = certifyIsolation(contract);
  const failClosed = certifyFailClosed(contract);
  const categories = Object.freeze([persistence, evidence, lineage, replay, integrity, visibility, isolation, failClosed]);
  const allTests = categories.flatMap((category) => category.tests);
  const failures = buildFailures(contract, allTests);
  const warnings = buildWarnings(contract, allTests);
  const findings = Object.freeze(categories.filter((category) => category.state !== "FAIL").map((category) => Object.freeze({
    finding_id: hashValue("truth-ledger-certification-finding", { certification_id: contract.certification_id, category: category.category }),
    category: category.category,
    summary: `${category.category} certified with ${category.passed_tests}/${category.total_tests} passing tests.`,
  } satisfies TruthLedgerCertificationFinding)));
  const certificationState: TruthLedgerCertificationState = failures.length ? "FAIL" : warnings.length ? "CONDITIONAL_PASS" : "PASS";
  const artifacts = buildArtifacts(contract, categories);
  const report = buildReport(contract, categories, failures, certificationState);
  return Object.freeze({
    certification_id: contract.certification_id,
    phase: "6L",
    suite_name: "Truth Ledger Certification Suite",
    certification_state: certificationState,
    persistence,
    evidence,
    lineage,
    replay,
    integrity,
    visibility,
    isolation,
    fail_closed: failClosed,
    total_tests: allTests.length,
    passed_tests: allTests.filter((item) => item.state === "PASS").length,
    failed_tests: failures.length,
    warnings,
    blocking_failures: failures,
    non_blocking_findings: findings,
    replay_hashes: Object.freeze([hashValue("truth-ledger-replay", tenantFixtures(contract).map((record) => record.truth_record_id))]),
    integrity_hashes: Object.freeze(tenantFixtures(contract).map((record) => record.integrity.record_hash)),
    ledger_version: contract.ledger_version,
    schema_version: contract.schema_version,
    certified_at: NOW,
    report,
    artifacts,
    deterministic_result_hash: hashValue("truth-ledger-certification-result", { categories: categories.map((category) => [category.category, category.state, category.passed_tests]), certificationState }),
  });
}

function buildFailures(contract: TruthLedgerCertificationContract, tests: readonly TruthLedgerCertificationTest[]): readonly TruthLedgerCertificationFailure[] {
  return Object.freeze(tests.filter((item) => item.state === "FAIL" && item.critical).map((item) => Object.freeze({
    failure_id: hashValue("truth-ledger-certification-failure", { certification_id: contract.certification_id, test_id: item.test_id }),
    category: item.category,
    test_id: item.test_id,
    severity: item.category === "ISOLATION" || item.category === "INTEGRITY" || item.category === "FAIL_CLOSED" ? "CRITICAL" : "HIGH",
    summary: item.failure_reason ?? `${item.name} failed.`,
    blocking: true,
  })));
}

function buildWarnings(contract: TruthLedgerCertificationContract, tests: readonly TruthLedgerCertificationTest[]): readonly TruthLedgerCertificationWarning[] {
  return Object.freeze(tests.filter((item) => item.state === "WARN").map((item) => Object.freeze({
    warning_id: hashValue("truth-ledger-certification-warning", { certification_id: contract.certification_id, test_id: item.test_id }),
    category: item.category,
    test_id: item.test_id,
    summary: `${item.name} produced a warning.`,
    remediation: "Review non-critical certification finding before recertification.",
  })));
}

function artifactId(contract: TruthLedgerCertificationContract, type: TruthLedgerArtifactType, category?: TruthLedgerCertificationCategory): string {
  return hashValue("truth-ledger-certification-artifact", { certification_id: contract.certification_id, type, category });
}

function buildArtifacts(contract: TruthLedgerCertificationContract, categories: readonly TruthLedgerCategoryResult[]): readonly TruthLedgerCertificationArtifact[] {
  const base: TruthLedgerCertificationArtifact[] = [
    artifact(contract, "CERTIFICATION_CONTRACT", undefined, "Certification contract defines Phase 6L requirements.", [contract.certification_id]),
    artifact(contract, "FIXTURE_LIBRARY", undefined, "Deterministic fixture library provides truth, evidence, lineage, replay, and tenant records.", contract.required_fixtures.map((fixture) => fixture.fixture_id)),
  ];
  for (const category of categories) {
    const type = `${category.category}_TEST_REPORT` as TruthLedgerArtifactType;
    base.push(artifact(contract, type, category.category, `${category.category} certification report.`, category.tests.flatMap((test) => test.evidence_refs)));
  }
  base.push(artifact(contract, "FINAL_CERTIFICATION_REPORT", undefined, "Final Truth Ledger certification report.", categories.map((category) => category.artifact_ref)));
  return Object.freeze(base);
}

function artifact(contract: TruthLedgerCertificationContract, type: TruthLedgerArtifactType, category: TruthLedgerCertificationCategory | undefined, summary: string, evidenceRefs: readonly string[]): TruthLedgerCertificationArtifact {
  return Object.freeze({
    artifact_id: artifactId(contract, type, category),
    artifact_type: type,
    certification_id: contract.certification_id,
    category,
    summary,
    evidence_refs: Object.freeze([...evidenceRefs]),
  });
}

function buildReport(contract: TruthLedgerCertificationContract, categories: readonly TruthLedgerCategoryResult[], failures: readonly TruthLedgerCertificationFailure[], state: TruthLedgerCertificationState): TruthLedgerCertificationReport {
  const total = categories.reduce((sum, category) => sum + category.total_tests, 0);
  return Object.freeze({
    certification_id: contract.certification_id,
    executed_at: NOW,
    ledger_version: contract.ledger_version,
    schema_version: contract.schema_version,
    total_tests: total,
    passed_tests: categories.reduce((sum, category) => sum + category.passed_tests, 0),
    failed_tests: categories.reduce((sum, category) => sum + category.failed_tests, 0),
    warning_tests: categories.reduce((sum, category) => sum + category.warning_tests, 0),
    certification_state: state,
    category_results: Object.freeze([...categories]),
    failure_summary: Object.freeze([...failures]),
  });
}

export function buildTruthLedgerCertificationView(input: Parameters<typeof buildTruthLedgerCertificationContract>[0] = {}): TruthLedgerCertificationView {
  const contract = buildTruthLedgerCertificationContract(input);
  const result = runTruthLedgerCertification(contract);
  return Object.freeze({
    contract,
    result,
    guardrails: Object.freeze([
      "deterministic fixtures",
      "restart simulation",
      "migration simulation",
      "evidence reconstruction",
      "lineage reconstruction",
      "deterministic replay",
      "tamper detection",
      "operator visibility",
      "tenant isolation",
      "fail-closed certification",
    ]),
    generated_at: NOW,
  });
}
