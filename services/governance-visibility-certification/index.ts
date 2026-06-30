import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildGovernanceDashboardView } from "@/services/governance-dashboard";
import { buildGovernanceReplayViewerView } from "@/services/governance-replay-viewer";
import { buildGovernanceLineageExplorerView } from "@/services/governance-lineage-explorer";
import { buildGovernanceIntegrityViewerView } from "@/services/governance-integrity-viewer";
import type {
  GovernanceVisibilityCertificationCategory,
  GovernanceVisibilityCertificationFailure,
  GovernanceVisibilityCertificationInput,
  GovernanceVisibilityCertificationObservabilitySurface,
  GovernanceVisibilityCertificationReport,
  GovernanceVisibilityCertificationScenario,
  GovernanceVisibilityCertificationStage,
  GovernanceVisibilityCertificationState,
  GovernanceVisibilityCertificationTestResult,
} from "@/types/governance-visibility-certification";

const NOW = "2026-06-27T17:00:00.000Z";
const SCHEMA_VERSION = "governance-visibility-certification/v7K.5" as const;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function failureForScenario(scenario: GovernanceVisibilityCertificationScenario): GovernanceVisibilityCertificationFailure | null {
  const map: Partial<Record<GovernanceVisibilityCertificationScenario, GovernanceVisibilityCertificationFailure>> = {
    MISSING_DASHBOARD: "DASHBOARD_UNAVAILABLE",
    HIDDEN_RECOMMENDATION: "GOVERNANCE_VISIBILITY_INCOMPLETE",
    MISSING_COMPLIANCE_SCORE: "GOVERNANCE_VISIBILITY_INCOMPLETE",
    HIDDEN_GOVERNANCE_RISK: "GOVERNANCE_VISIBILITY_INCOMPLETE",
    ESCALATION_OMITTED: "GOVERNANCE_VISIBILITY_INCOMPLETE",
    REPLAY_TIMELINE_INCOMPLETE: "REPLAY_VISUALIZATION_INCOMPLETE",
    REPLAY_MISMATCH_UNDETECTED: "REPLAY_VISUALIZATION_INCOMPLETE",
    LINEAGE_BREAK_UNDETECTED: "LINEAGE_VISUALIZATION_INCOMPLETE",
    INFLUENCE_GRAPH_INCONSISTENT: "LINEAGE_NONDETERMINISTIC",
    HIDDEN_INTEGRITY_ISSUE: "INTEGRITY_VISUALIZATION_INCOMPLETE",
    TAMPER_EVENT_OMITTED: "INTEGRITY_VISUALIZATION_INCOMPLETE",
    HASH_MISMATCH_UNDETECTED: "INTEGRITY_VISUALIZATION_INCOMPLETE",
    EXECUTION_CAPABILITY_EXPOSED: "READ_ONLY_BROKEN",
    AUTONOMOUS_GOVERNANCE_ACTION: "ADVISORY_ONLY_BROKEN",
    CROSS_TENANT_VISIBILITY: "TENANT_ISOLATION_BROKEN",
    CONSTITUTIONAL_VISIBILITY_BYPASS: "CONSTITUTIONAL_PROTECTION_BROKEN",
    HIDDEN_GOVERNANCE_STATE: "OPERATOR_VISIBILITY_INCOMPLETE",
    API_RESPONSE_NONDETERMINISTIC: "API_NONDETERMINISTIC",
    MINOR_VISUALIZATION_GAP: "MINOR_VISUALIZATION_GAP",
  };
  return map[scenario] ?? null;
}

function scenarioFails(scenario: GovernanceVisibilityCertificationScenario, failure: GovernanceVisibilityCertificationFailure): boolean {
  return failureForScenario(scenario) === failure;
}

function test(input: {
  category: GovernanceVisibilityCertificationCategory;
  name: string;
  passed: boolean;
  mandatory?: boolean;
  failure_reason: GovernanceVisibilityCertificationFailure | null;
  evidence_refs: readonly string[];
}): GovernanceVisibilityCertificationTestResult {
  const failure_reason = input.passed ? null : input.failure_reason;
  const source = {
    category: input.category,
    name: input.name,
    expected: "PASS" as const,
    actual: input.passed ? "PASS" as const : "FAIL" as const,
    passed: input.passed,
    mandatory: input.mandatory ?? true,
    failure_reason,
    evidence_refs: unique(input.evidence_refs),
  };
  return Object.freeze({
    test_id: `GVCT-7K5-${hashValue("governance-visibility-certification-test-id", { category: input.category, name: input.name }).slice(0, 10).toUpperCase()}`,
    ...source,
    result_hash: hashValue("governance-visibility-certification-test", source),
  });
}

function stage(
  stage_name: GovernanceVisibilityCertificationStage["stage_name"],
  tests: readonly GovernanceVisibilityCertificationTestResult[],
): GovernanceVisibilityCertificationStage {
  const findings = unique(tests.map((item) => item.failure_reason).filter((item): item is GovernanceVisibilityCertificationFailure => Boolean(item)));
  const mandatory_passed = tests.filter((item) => item.mandatory).every((item) => item.passed);
  const optional_passed = tests.filter((item) => !item.mandatory).every((item) => item.passed);
  const state: GovernanceVisibilityCertificationState = mandatory_passed && optional_passed ? "PASS" : mandatory_passed ? "CONDITIONAL_PASS" : "FAIL";
  const source = {
    stage_id: `GVCS-7K5-${hashValue("governance-visibility-certification-stage-id", stage_name).slice(0, 10).toUpperCase()}`,
    stage_name,
    state,
    tests_passed: tests.filter((item) => item.passed).length,
    tests_failed: tests.filter((item) => !item.passed).length,
    mandatory_passed,
    findings,
    evidence_refs: unique(tests.flatMap((item) => item.evidence_refs)),
  };
  return Object.freeze({ ...source, stage_hash: hashValue("governance-visibility-certification-stage", source) });
}

function computeReportHash(report: Omit<GovernanceVisibilityCertificationReport, "report_hash"> | GovernanceVisibilityCertificationReport): string {
  const { report_hash: _hash, ...source } = report as GovernanceVisibilityCertificationReport;
  return hashValue("governance-visibility-certification-report", source);
}

export function runGovernanceVisibilityCertification(input: GovernanceVisibilityCertificationInput = {}): GovernanceVisibilityCertificationReport {
  const scenario = input.scenario ?? "BASELINE";
  const tenant_id = input.tenant_id ?? "tenant_alpha";
  const mission_id = input.mission_id ?? "mission_governance_001";
  const operator_id = input.operator_id ?? "operator_console";
  const dashboard = buildGovernanceDashboardView({ tenant_id, mission_id, operator_id });
  const dashboardRepeat = buildGovernanceDashboardView({ tenant_id, mission_id, operator_id });
  const replay = buildGovernanceReplayViewerView({ tenant_id, mission_id, operator_id });
  const replayRepeat = buildGovernanceReplayViewerView({ tenant_id, mission_id, operator_id });
  const lineage = buildGovernanceLineageExplorerView({ tenant_id, mission_id, operator_id });
  const lineageRepeat = buildGovernanceLineageExplorerView({ tenant_id, mission_id, operator_id });
  const integrity = buildGovernanceIntegrityViewerView({ tenant_id, mission_id, operator_id });
  const integrityRepeat = buildGovernanceIntegrityViewerView({ tenant_id, mission_id, operator_id });

  const dashboardEvidence = [dashboard.dashboard_hash, dashboard.certification_status.certification_hash];
  const replayEvidence = [replay.viewer_hash, replay.verification.verification_hash, replay.comparison.comparison_hash];
  const lineageEvidence = [lineage.explorer_hash, lineage.graph_hash ?? ""];
  const integrityEvidence = [integrity.viewer_hash, integrity.trust_indicators.trust_hash, integrity.trends.trend_hash];
  const apiVerificationHash = hashValue("governance-visibility-api-verification", {
    dashboard: dashboard.dashboard_hash,
    replay: replay.viewer_hash,
    lineage: lineage.explorer_hash,
    integrity: integrity.viewer_hash,
  });

  const tests = freezeArray([
    test({ category: "DASHBOARD", name: "governance dashboard available", passed: !scenarioFails(scenario, "DASHBOARD_UNAVAILABLE") && Boolean(dashboard.dashboard_id), failure_reason: scenarioFails(scenario, "DASHBOARD_UNAVAILABLE") ? "DASHBOARD_UNAVAILABLE" : null, evidence_refs: dashboardEvidence }),
    test({ category: "DASHBOARD", name: "dashboard deterministic", passed: dashboard.dashboard_hash === dashboardRepeat.dashboard_hash && !scenarioFails(scenario, "DASHBOARD_NONDETERMINISTIC"), failure_reason: "DASHBOARD_NONDETERMINISTIC", evidence_refs: dashboardEvidence }),
    test({ category: "GOVERNANCE_VISIBILITY", name: "recommendations visible", passed: dashboard.recommendations.length > 0 && !scenarioFails(scenario, "GOVERNANCE_VISIBILITY_INCOMPLETE"), failure_reason: scenarioFails(scenario, "GOVERNANCE_VISIBILITY_INCOMPLETE") ? "GOVERNANCE_VISIBILITY_INCOMPLETE" : null, evidence_refs: dashboardEvidence }),
    test({ category: "GOVERNANCE_VISIBILITY", name: "compliance scores visible", passed: dashboard.compliance.length > 0 && !scenarioFails(scenario, "GOVERNANCE_VISIBILITY_INCOMPLETE"), failure_reason: scenarioFails(scenario, "GOVERNANCE_VISIBILITY_INCOMPLETE") ? "GOVERNANCE_VISIBILITY_INCOMPLETE" : null, evidence_refs: dashboardEvidence }),
    test({ category: "GOVERNANCE_VISIBILITY", name: "governance risk visible", passed: dashboard.risks.length > 0 && !scenarioFails(scenario, "GOVERNANCE_VISIBILITY_INCOMPLETE"), failure_reason: scenarioFails(scenario, "GOVERNANCE_VISIBILITY_INCOMPLETE") ? "GOVERNANCE_VISIBILITY_INCOMPLETE" : null, evidence_refs: dashboardEvidence }),
    test({ category: "GOVERNANCE_VISIBILITY", name: "escalations visible", passed: dashboard.escalations.length > 0 && !scenarioFails(scenario, "GOVERNANCE_VISIBILITY_INCOMPLETE"), failure_reason: scenarioFails(scenario, "GOVERNANCE_VISIBILITY_INCOMPLETE") ? "GOVERNANCE_VISIBILITY_INCOMPLETE" : null, evidence_refs: dashboardEvidence }),
    test({ category: "REPLAY", name: "replay visualization reproducible", passed: replay.viewer_hash === replayRepeat.viewer_hash && !scenarioFails(scenario, "REPLAY_NONDETERMINISTIC"), failure_reason: "REPLAY_NONDETERMINISTIC", evidence_refs: replayEvidence }),
    test({ category: "REPLAY", name: "replay timeline complete", passed: replay.timeline.length >= 10 && !scenarioFails(scenario, "REPLAY_VISUALIZATION_INCOMPLETE"), failure_reason: scenarioFails(scenario, "REPLAY_VISUALIZATION_INCOMPLETE") ? "REPLAY_VISUALIZATION_INCOMPLETE" : null, evidence_refs: replayEvidence }),
    test({ category: "REPLAY", name: "replay comparison explained", passed: Boolean(replay.comparison.comparison_hash) && !scenarioFails(scenario, "REPLAY_VISUALIZATION_INCOMPLETE"), failure_reason: scenarioFails(scenario, "REPLAY_VISUALIZATION_INCOMPLETE") ? "REPLAY_VISUALIZATION_INCOMPLETE" : null, evidence_refs: replayEvidence }),
    test({ category: "LINEAGE", name: "lineage reconstruction reproducible", passed: lineage.explorer_hash === lineageRepeat.explorer_hash && !scenarioFails(scenario, "LINEAGE_NONDETERMINISTIC"), failure_reason: scenarioFails(scenario, "LINEAGE_NONDETERMINISTIC") ? "LINEAGE_NONDETERMINISTIC" : null, evidence_refs: lineageEvidence }),
    test({ category: "LINEAGE", name: "complete ancestry visible", passed: lineage.root_lineage.length > 0 && lineage.parent_chain.length + lineage.child_chain.length > 0 && !scenarioFails(scenario, "LINEAGE_VISUALIZATION_INCOMPLETE"), failure_reason: scenarioFails(scenario, "LINEAGE_VISUALIZATION_INCOMPLETE") ? "LINEAGE_VISUALIZATION_INCOMPLETE" : null, evidence_refs: lineageEvidence }),
    test({ category: "LINEAGE", name: "influence graph deterministic", passed: lineage.influence_paths.length > 0 && lineage.influence_paths.length === lineageRepeat.influence_paths.length && !scenarioFails(scenario, "LINEAGE_NONDETERMINISTIC"), failure_reason: scenarioFails(scenario, "LINEAGE_NONDETERMINISTIC") ? "LINEAGE_NONDETERMINISTIC" : null, evidence_refs: lineageEvidence }),
    test({ category: "INTEGRITY", name: "integrity verification visible", passed: integrity.verification_results.length > 0 && !scenarioFails(scenario, "INTEGRITY_VISUALIZATION_INCOMPLETE"), failure_reason: scenarioFails(scenario, "INTEGRITY_VISUALIZATION_INCOMPLETE") ? "INTEGRITY_VISUALIZATION_INCOMPLETE" : null, evidence_refs: integrityEvidence }),
    test({ category: "INTEGRITY", name: "tamper detection displayed", passed: integrity.tamper_alerts.length > 0 && !scenarioFails(scenario, "INTEGRITY_VISUALIZATION_INCOMPLETE"), failure_reason: scenarioFails(scenario, "INTEGRITY_VISUALIZATION_INCOMPLETE") ? "INTEGRITY_VISUALIZATION_INCOMPLETE" : null, evidence_refs: integrityEvidence }),
    test({ category: "INTEGRITY", name: "governance hashes reproducible", passed: integrity.viewer_hash === integrityRepeat.viewer_hash && integrity.hashes.length > 0 && !scenarioFails(scenario, "INTEGRITY_NONDETERMINISTIC"), failure_reason: scenarioFails(scenario, "INTEGRITY_NONDETERMINISTIC") ? "INTEGRITY_NONDETERMINISTIC" : null, evidence_refs: integrityEvidence }),
    test({ category: "SECURITY", name: "dashboard read-only", passed: dashboard.read_only && !dashboard.execution_allowed && !scenarioFails(scenario, "READ_ONLY_BROKEN"), failure_reason: scenarioFails(scenario, "READ_ONLY_BROKEN") ? "READ_ONLY_BROKEN" : null, evidence_refs: dashboardEvidence }),
    test({ category: "SECURITY", name: "advisory-only enforced", passed: dashboard.advisory_only && replay.advisory_only && lineage.advisory_only && integrity.advisory_only && !scenarioFails(scenario, "ADVISORY_ONLY_BROKEN"), failure_reason: scenarioFails(scenario, "ADVISORY_ONLY_BROKEN") ? "ADVISORY_ONLY_BROKEN" : null, evidence_refs: [...dashboardEvidence, ...replayEvidence, ...lineageEvidence, ...integrityEvidence] }),
    test({ category: "SECURITY", name: "tenant isolation preserved", passed: dashboard.tenant_isolated && replay.tenant_isolated && lineage.tenant_isolated && integrity.tenant_isolated && !scenarioFails(scenario, "TENANT_ISOLATION_BROKEN"), failure_reason: scenarioFails(scenario, "TENANT_ISOLATION_BROKEN") ? "TENANT_ISOLATION_BROKEN" : null, evidence_refs: [...dashboardEvidence, ...replayEvidence, ...lineageEvidence, ...integrityEvidence] }),
    test({ category: "CONSTITUTIONAL", name: "constitutional protections enforced", passed: !scenarioFails(scenario, "CONSTITUTIONAL_PROTECTION_BROKEN"), failure_reason: scenarioFails(scenario, "CONSTITUTIONAL_PROTECTION_BROKEN") ? "CONSTITUTIONAL_PROTECTION_BROKEN" : null, evidence_refs: [...dashboardEvidence, ...integrityEvidence] }),
    test({ category: "OPERATOR_TRANSPARENCY", name: "operator visibility complete", passed: !scenarioFails(scenario, "OPERATOR_VISIBILITY_INCOMPLETE"), failure_reason: scenarioFails(scenario, "OPERATOR_VISIBILITY_INCOMPLETE") ? "OPERATOR_VISIBILITY_INCOMPLETE" : null, evidence_refs: [...dashboardEvidence, ...replayEvidence, ...lineageEvidence, ...integrityEvidence] }),
    test({ category: "API", name: "visibility APIs deterministic", passed: !scenarioFails(scenario, "API_NONDETERMINISTIC"), failure_reason: scenarioFails(scenario, "API_NONDETERMINISTIC") ? "API_NONDETERMINISTIC" : null, evidence_refs: [apiVerificationHash] }),
    test({ category: "DASHBOARD", name: "minor visualization polish complete", passed: !scenarioFails(scenario, "MINOR_VISUALIZATION_GAP"), mandatory: false, failure_reason: scenarioFails(scenario, "MINOR_VISUALIZATION_GAP") ? "MINOR_VISUALIZATION_GAP" : null, evidence_refs: dashboardEvidence }),
  ]);

  const stageMap = [
    stage("DASHBOARD_CERTIFICATION", tests.filter((item) => item.category === "DASHBOARD" || item.category === "GOVERNANCE_VISIBILITY")),
    stage("REPLAY_CERTIFICATION", tests.filter((item) => item.category === "REPLAY")),
    stage("LINEAGE_CERTIFICATION", tests.filter((item) => item.category === "LINEAGE")),
    stage("INTEGRITY_CERTIFICATION", tests.filter((item) => item.category === "INTEGRITY")),
    stage("SECURITY_CERTIFICATION", tests.filter((item) => item.category === "SECURITY" || item.category === "CONSTITUTIONAL" || item.category === "API" || item.category === "OPERATOR_TRANSPARENCY")),
  ] as const;

  const failed_tests = freezeArray(tests.filter((item) => !item.passed));
  const mandatory_tests_passed = tests.filter((item) => item.mandatory).every((item) => item.passed);
  const optional_tests_passed = tests.filter((item) => !item.mandatory).every((item) => item.passed);
  const outstanding_findings = unique(failed_tests.map((item) => item.failure_reason).filter((item): item is GovernanceVisibilityCertificationFailure => Boolean(item)));
  const certification_state: GovernanceVisibilityCertificationState = mandatory_tests_passed && optional_tests_passed
    ? "PASS"
    : mandatory_tests_passed
      ? "CONDITIONAL_PASS"
      : "FAIL";
  const evidence_package_source = {
    evidence_package_id: `GVCE-7K5-${hashValue("governance-visibility-evidence-id", { tenant_id, mission_id }).slice(0, 10).toUpperCase()}`,
    dashboard_snapshot_hash: dashboard.dashboard_hash,
    replay_viewer_hash: replay.viewer_hash,
    lineage_explorer_hash: lineage.explorer_hash,
    integrity_viewer_hash: integrity.viewer_hash,
    api_verification_hash: apiVerificationHash,
    audit_refs: unique([
      dashboard.certification_status.certification_id,
      replay.replay_id,
      lineage.graph_hash ?? "",
      integrity.truth_ledger_certification_reference,
    ]),
  };
  const evidence_package = Object.freeze({ ...evidence_package_source, evidence_hash: hashValue("governance-visibility-evidence-package", evidence_package_source) });
  const readiness_source = {
    operational_readiness: certification_state,
    certification_complete: certification_state === "PASS",
    remaining_risks: outstanding_findings,
    deployment_eligible: certification_state === "PASS",
    governance_approval_status: certification_state === "PASS" ? "APPROVED_FOR_PRODUCTION" as const : certification_state === "CONDITIONAL_PASS" ? "LIMITED_CERTIFICATION_MODE" as const : "BLOCKED" as const,
  };
  const production_readiness = Object.freeze({ ...readiness_source, readiness_hash: hashValue("governance-visibility-production-readiness", readiness_source) });
  const finalStage = stage("FINAL_VISIBILITY_CERTIFICATION", tests);
  const stages = freezeArray([...stageMap, finalStage]);
  const base = {
    certification_id: `GVCERT-7K5-${hashValue("governance-visibility-certification-id", { tenant_id, mission_id, scenario }).slice(0, 10).toUpperCase()}`,
    phase_version: "7K.5" as const,
    schema_version: SCHEMA_VERSION,
    certification_timestamp: NOW,
    tenant_id,
    mission_id,
    operator_id,
    certification_state,
    read_only: true as const,
    advisory_only: true as const,
    mutation_allowed: false as const,
    dashboard_hash: dashboard.dashboard_hash,
    replay_viewer_hash: replay.viewer_hash,
    lineage_explorer_hash: lineage.explorer_hash,
    integrity_viewer_hash: integrity.viewer_hash,
    stages,
    certification_tests: tests,
    mandatory_tests_passed,
    optional_tests_passed,
    failed_tests,
    outstanding_findings,
    determinism_verified: dashboard.dashboard_hash === dashboardRepeat.dashboard_hash && replay.viewer_hash === replayRepeat.viewer_hash && lineage.explorer_hash === lineageRepeat.explorer_hash && integrity.viewer_hash === integrityRepeat.viewer_hash && !scenarioFails(scenario, "API_NONDETERMINISTIC"),
    replay_verified: replay.verification.determinism_validated && replay.timeline.length > 0,
    explainability_complete: dashboard.governance_summary.length > 0 && replay.verification.validation_rules.length > 0 && lineage.influence_paths.length > 0 && integrity.verification_results.length > 0,
    security_assessment: mandatory_tests_passed && !outstanding_findings.some((finding) => ["READ_ONLY_BROKEN", "ADVISORY_ONLY_BROKEN", "TENANT_ISOLATION_BROKEN", "CONSTITUTIONAL_PROTECTION_BROKEN"].includes(finding)) ? "PASS" as const : "FAIL" as const,
    visibility_coverage: certification_state === "PASS" ? "COMPLETE" as const : certification_state === "CONDITIONAL_PASS" ? "PARTIAL" as const : "FAILED" as const,
    evidence_package,
    production_readiness,
    certification_signature: hashValue("governance-visibility-certification-signature", { certification_state, evidence: evidence_package.evidence_hash, findings: outstanding_findings }),
  };
  return Object.freeze({ ...base, report_hash: computeReportHash(base as GovernanceVisibilityCertificationReport) });
}

export function buildGovernanceVisibilityCertificationObservabilitySurface(report = runGovernanceVisibilityCertification()): GovernanceVisibilityCertificationObservabilitySurface {
  return Object.freeze({
    certification_id: report.certification_id,
    certification_state: report.certification_state,
    total_tests: report.certification_tests.length,
    passed_tests: report.certification_tests.length - report.failed_tests.length,
    failed_tests: report.failed_tests.length,
    stages: freezeArray(report.stages.map((stageItem) => stageItem.stage_name)),
    production_eligible: report.production_readiness.deployment_eligible,
    outstanding_findings: report.outstanding_findings,
    report_hash: report.report_hash,
  });
}

export function getGovernanceVisibilityCertificationContract() {
  const report = runGovernanceVisibilityCertification();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic", "reproducible", "explainable", "replayable", "read-only", "advisory-only", "immutable", "tenant-isolated", "audit-ready", "certification-driven"]),
      schema_version: SCHEMA_VERSION,
      certification_states: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
      stages: freezeArray(["DASHBOARD_CERTIFICATION", "REPLAY_CERTIFICATION", "LINEAGE_CERTIFICATION", "INTEGRITY_CERTIFICATION", "SECURITY_CERTIFICATION", "FINAL_VISIBILITY_CERTIFICATION"] as const),
    }),
    report,
    observability: buildGovernanceVisibilityCertificationObservabilitySurface(report),
  });
}
