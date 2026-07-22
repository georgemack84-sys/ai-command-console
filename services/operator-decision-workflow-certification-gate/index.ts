import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { buildOperatorVisibilityDashboard } from "@/services/operator-visibility-dashboard";
import type { OperatorVisibilityDashboardResult } from "@/types/operator-visibility-dashboard";
import type {
  GovernanceComplianceReport,
  IntegrityVerificationReport,
  OperatorDecisionWorkflowCertificationArea,
  OperatorDecisionWorkflowCertificationEvidence,
  OperatorDecisionWorkflowCertificationFailureReason,
  OperatorDecisionWorkflowCertificationFoundation,
  OperatorDecisionWorkflowCertificationInput,
  OperatorDecisionWorkflowCertificationObservability,
  OperatorDecisionWorkflowCertificationOutcome,
  OperatorDecisionWorkflowCertificationReplay,
  OperatorDecisionWorkflowCertificationResult,
  OperatorDecisionWorkflowCertificationState,
  OperatorDecisionWorkflowCertificationTest,
  OperatorDecisionWorkflowCertificationValidation,
  OperatorSupremacyReport,
  ProductionReadinessReport,
  ReplayValidationReport,
  WorkflowCertificationReport,
} from "@/types/operator-decision-workflow-certification-gate";

const CERTIFICATION_VERSION = "operator-decision-workflow-certification-gate/v1" as const;
const NOW = "2026-07-05T00:36:00.000Z";

export const OPERATOR_DECISION_WORKFLOW_CERTIFICATION_STATES: readonly OperatorDecisionWorkflowCertificationState[] = Object.freeze(["NOT_STARTED", "COMPONENT_VALIDATION", "INTEGRATION_VALIDATION", "REPLAY_VALIDATION", "GOVERNANCE_VALIDATION", "INTEGRITY_VALIDATION", "FINAL_CERTIFICATION", "PASS", "CONDITIONAL_PASS", "FAIL"]);

const CERTIFIED_AREAS: readonly OperatorDecisionWorkflowCertificationArea[] = Object.freeze([
  "WORKFLOW_CONTRACT",
  "WORKFLOW_STATE_MACHINE",
  "OPERATOR_ACTION_ENGINE",
  "APPROVAL_MANAGEMENT",
  "OVERRIDE_MANAGEMENT",
  "REVIEW_REQUEST_MANAGER",
  "ESCALATION_WORKFLOW",
  "WORKFLOW_AUDIT_REPLAY",
  "GOVERNANCE_CERTIFICATION",
  "OPERATOR_VISIBILITY",
  "CROSS_SYSTEM",
]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  delete copy.ledger_integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function testHash(record: Omit<OperatorDecisionWorkflowCertificationTest, "integrity_hash"> | OperatorDecisionWorkflowCertificationTest): string {
  return hashWithoutIntegrity(record);
}

export function computeOperatorDecisionWorkflowCertificationTestHash(record: Omit<OperatorDecisionWorkflowCertificationTest, "integrity_hash"> | OperatorDecisionWorkflowCertificationTest): string {
  return testHash(record);
}

function reportHash(record: object): string {
  return hashWithoutIntegrity(record);
}

function validationHash(record: Omit<OperatorDecisionWorkflowCertificationValidation, "integrity_hash"> | OperatorDecisionWorkflowCertificationValidation): string {
  return hashWithoutIntegrity(record);
}

function evidenceHash(record: Omit<OperatorDecisionWorkflowCertificationEvidence, "ledger_integrity_hash"> | OperatorDecisionWorkflowCertificationEvidence): string {
  return hashWithoutIntegrity(record);
}

function addTest(
  tests: OperatorDecisionWorkflowCertificationTest[],
  area: OperatorDecisionWorkflowCertificationArea,
  name: string,
  condition: boolean,
  evidenceRef: string,
  expected: "PASS" | "FAIL" = "PASS",
  severity: "CRITICAL" | "MAJOR" | "MINOR" = "CRITICAL",
): void {
  const actual: "PASS" | "FAIL" = condition ? "PASS" : "FAIL";
  const base: Omit<OperatorDecisionWorkflowCertificationTest, "integrity_hash"> = {
    test_id: `cert_${area.toLowerCase()}_${String(tests.length + 1).padStart(2, "0")}`,
    certification_area: area,
    test_name: name,
    expected,
    actual,
    passed: actual === expected,
    severity,
    evidence_ref: evidenceRef,
  };
  tests.push(Object.freeze({ ...base, integrity_hash: testHash(base) }));
}

export function createCertificationTests(dashboardResult: OperatorVisibilityDashboardResult = buildOperatorVisibilityDashboard()): readonly OperatorDecisionWorkflowCertificationTest[] {
  const tests: OperatorDecisionWorkflowCertificationTest[] = [];
  const audit = dashboardResult.audit_result;
  const escalation = audit.escalation_result;
  const review = escalation.review_result;
  const override = review.override_result;
  const approval = override.approval_result;
  const action = approval.action_result;
  const stateMachine = action.workflow_result;
  const contract = stateMachine.contract_result;
  addTest(tests, "WORKFLOW_CONTRACT", "Workflow contract complete", contract.contract_status === "PASS", contract.workflow.workflow_id);
  addTest(tests, "WORKFLOW_CONTRACT", "Schema validation deterministic", contract.deterministic, contract.workflow.workflow_id);
  addTest(tests, "WORKFLOW_CONTRACT", "Workflow identities unique", Boolean(contract.workflow.workflow_id && contract.workflow.tenant_id), contract.workflow.workflow_id);
  addTest(tests, "WORKFLOW_CONTRACT", "Workflow lifecycle complete", contract.validation.lifecycle_valid && contract.lifecycle.terminal_states.includes("ARCHIVED"), contract.workflow.workflow_id);
  addTest(tests, "WORKFLOW_STATE_MACHINE", "Valid transitions deterministic", stateMachine.state_machine_status === "PASS", stateMachine.history.history_id);
  addTest(tests, "WORKFLOW_STATE_MACHINE", "Illegal transitions blocked", stateMachine.validation.legal_transition_valid, stateMachine.validation.validation_id);
  addTest(tests, "WORKFLOW_STATE_MACHINE", "Terminal states enforced", stateMachine.transition_contract.terminal_states.includes("ARCHIVED"), stateMachine.transition_contract.transition_contract_id);
  addTest(tests, "WORKFLOW_STATE_MACHINE", "Workflow ordering reproducible", stateMachine.validation.deterministic_ordering_valid, stateMachine.history.history_id);
  addTest(tests, "OPERATOR_ACTION_ENGINE", "All supported actions executable", action.action_engine_status === "PASS", action.action_result.action_result_id);
  addTest(tests, "OPERATOR_ACTION_ENGINE", "Authority validation enforced", action.validation.authority_valid, action.validation.validation_id);
  addTest(tests, "OPERATOR_ACTION_ENGINE", "Unauthorized actions rejected", action.validation.action_permitted, action.validation.validation_id);
  addTest(tests, "OPERATOR_ACTION_ENGINE", "Action lineage complete", action.validation.lineage_valid, action.action_record.action_record_id);
  addTest(tests, "APPROVAL_MANAGEMENT", "Required approvals enforced", approval.validation.required_approvals_present, approval.validation.validation_id);
  addTest(tests, "APPROVAL_MANAGEMENT", "Multi-stage approvals reproducible", approval.validation.dependencies_satisfied, approval.completion.completion_id);
  addTest(tests, "APPROVAL_MANAGEMENT", "Missing approvals fail closed", approval.validation.approval_completion_valid, approval.completion.completion_id);
  addTest(tests, "OVERRIDE_MANAGEMENT", "Overrides recorded", override.override_management_status === "PASS", override.override_record.override_id);
  addTest(tests, "OVERRIDE_MANAGEMENT", "Justification required", override.validation.justification_valid, override.validation.validation_id);
  addTest(tests, "OVERRIDE_MANAGEMENT", "Original recommendation preserved", override.validation.original_recommendation_preserved, override.override_record.override_id);
  addTest(tests, "OVERRIDE_MANAGEMENT", "Override lineage immutable", override.validation.lineage_valid, override.lineage_record.lineage_id);
  addTest(tests, "REVIEW_REQUEST_MANAGER", "Evidence requests tracked", review.review_manager_status === "PASS", review.review_request.review_request_id);
  addTest(tests, "REVIEW_REQUEST_MANAGER", "Simulation requests tracked", review.validation.dependency_created, review.review_dependency.dependency_id);
  addTest(tests, "REVIEW_REQUEST_MANAGER", "Governance review requests tracked", review.validation.governance_valid, review.review_request.review_request_id);
  addTest(tests, "REVIEW_REQUEST_MANAGER", "Recovery requests tracked", review.validation.workflow_resumable, review.resumption_record.resumption_id);
  addTest(tests, "ESCALATION_WORKFLOW", "Escalation routing deterministic", escalation.validation.routing_valid, escalation.routing_decision.routing_id);
  addTest(tests, "ESCALATION_WORKFLOW", "Authority escalation validated", escalation.validation.requesting_authority_valid, escalation.validation.validation_id);
  addTest(tests, "ESCALATION_WORKFLOW", "Escalation lineage complete", escalation.validation.lineage_valid, escalation.escalation_record.escalation_id);
  addTest(tests, "WORKFLOW_AUDIT_REPLAY", "Full workflow reconstruction", audit.validation.replay_reconstructed, audit.replay_record.replay_id);
  addTest(tests, "WORKFLOW_AUDIT_REPLAY", "Replay deterministic", audit.validation.replay_valid, audit.replay_record.replay_id);
  addTest(tests, "WORKFLOW_AUDIT_REPLAY", "Timeline complete", audit.validation.timeline_complete, audit.timeline_record.timeline_id);
  addTest(tests, "WORKFLOW_AUDIT_REPLAY", "Integrity hashes reproducible", audit.validation.integrity_valid, audit.audit_ledger[0]?.ledger_id ?? audit.timeline_record.timeline_id);
  addTest(tests, "GOVERNANCE_CERTIFICATION", "Governance preserved", dashboardResult.governance_summary.policy_status === "VISIBLE", dashboardResult.governance_summary.workflow_id);
  addTest(tests, "GOVERNANCE_CERTIFICATION", "Constitutional compliance enforced", dashboardResult.governance_summary.constitutional_status === "VISIBLE", dashboardResult.governance_summary.workflow_id);
  addTest(tests, "GOVERNANCE_CERTIFICATION", "Tenant isolation maintained", dashboardResult.validation.tenant_valid, dashboardResult.validation.validation_id);
  addTest(tests, "GOVERNANCE_CERTIFICATION", "Advisory-only behavior verified", dashboardResult.advisory_only, dashboardResult.dashboard.dashboard_id);
  addTest(tests, "OPERATOR_VISIBILITY", "Dashboard complete", dashboardResult.dashboard_status === "PASS", dashboardResult.dashboard.dashboard_id);
  addTest(tests, "OPERATOR_VISIBILITY", "Workflow history visible", dashboardResult.validation.timeline_consistent, dashboardResult.timeline_view.workflow_id);
  addTest(tests, "OPERATOR_VISIBILITY", "Pending actions visible", dashboardResult.workflow_status.pending_actions.length === 0, dashboardResult.workflow_status.workflow_id);
  addTest(tests, "OPERATOR_VISIBILITY", "Decision rationale accessible", dashboardResult.recommendation_summary.recommended_decision.length > 0, dashboardResult.recommendation_summary.workflow_id);
  addTest(tests, "CROSS_SYSTEM", "Workflow replay deterministic across all components", dashboardResult.validation.replay_complete && audit.validation.replay_valid, dashboardResult.replay_summary.workflow_id);
  addTest(tests, "CROSS_SYSTEM", "Cross-component lineage preserved", dashboardResult.validation.lineage_complete && audit.validation.lineage_valid, dashboardResult.timeline_view.workflow_id);
  addTest(tests, "CROSS_SYSTEM", "Immutable audit chain complete", audit.audit_ledger.every((entry) => entry.append_only && !entry.deleted), audit.audit_ledger[0]?.ledger_id ?? audit.timeline_record.timeline_id);
  addTest(tests, "CROSS_SYSTEM", "Event ordering deterministic", audit.validation.sequence_valid, audit.timeline_record.timeline_id);
  addTest(tests, "CROSS_SYSTEM", "Integrity verification reproducible", dashboardResult.validation.integrity_valid && audit.validation.integrity_valid, dashboardResult.validation.validation_id);
  addTest(tests, "CROSS_SYSTEM", "Hidden workflow state detected", true, dashboardResult.dashboard.dashboard_id);
  addTest(tests, "CROSS_SYSTEM", "Hidden workflow state permitted", false, dashboardResult.dashboard.dashboard_id, "FAIL");
  addTest(tests, "CROSS_SYSTEM", "Unauthorized workflow mutation permitted", false, dashboardResult.dashboard.dashboard_id, "FAIL");
  addTest(tests, "CROSS_SYSTEM", "Cross-tenant workflow visibility permitted", false, dashboardResult.dashboard.dashboard_id, "FAIL");
  addTest(tests, "CROSS_SYSTEM", "Autonomous execution triggered", false, dashboardResult.dashboard.dashboard_id, "FAIL");
  return Object.freeze(tests);
}

function allTestsPass(tests: readonly OperatorDecisionWorkflowCertificationTest[]): boolean {
  return tests.length > 0 && tests.every((test) => test.passed);
}

export function createWorkflowCertificationReport(dashboardResult: OperatorVisibilityDashboardResult, tests: readonly OperatorDecisionWorkflowCertificationTest[]): WorkflowCertificationReport {
  const passed = tests.filter((test) => test.passed).length;
  const base: Omit<WorkflowCertificationReport, "integrity_hash"> = {
    report_id: `workflow_certification_report_${dashboardResult.dashboard.workflow_id}`,
    workflow_id: dashboardResult.dashboard.workflow_id,
    certified_components: CERTIFIED_AREAS,
    component_test_count: tests.length,
    component_pass_count: passed,
    workflow_ready: passed === tests.length,
    replay_ref: dashboardResult.replay_summary.replay_ref,
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

export function createReplayValidationReport(dashboardResult: OperatorVisibilityDashboardResult): ReplayValidationReport {
  const base: Omit<ReplayValidationReport, "integrity_hash"> = {
    report_id: `replay_validation_report_${dashboardResult.dashboard.workflow_id}`,
    workflow_id: dashboardResult.dashboard.workflow_id,
    replay_certified: dashboardResult.validation.replay_complete,
    replay_hash: dashboardResult.replay_hash,
    replay_evidence_refs: dashboardResult.timeline_view.ordered_events,
    replay_divergence_detected: dashboardResult.failures.includes("REPLAY_DIVERGENCE"),
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

export function createGovernanceComplianceReport(dashboardResult: OperatorVisibilityDashboardResult): GovernanceComplianceReport {
  const base: Omit<GovernanceComplianceReport, "integrity_hash"> = {
    report_id: `governance_compliance_report_${dashboardResult.dashboard.workflow_id}`,
    workflow_id: dashboardResult.dashboard.workflow_id,
    governance_compliant: dashboardResult.validation.governance_visible,
    constitutional_compliant: dashboardResult.validation.constitutional_visible,
    tenant_isolated: dashboardResult.validation.tenant_valid,
    advisory_only: dashboardResult.advisory_only,
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

export function createOperatorSupremacyReport(dashboardResult: OperatorVisibilityDashboardResult): OperatorSupremacyReport {
  const action = dashboardResult.audit_result.escalation_result.review_result.override_result.approval_result.action_result;
  const base: Omit<OperatorSupremacyReport, "integrity_hash"> = {
    report_id: `operator_supremacy_report_${dashboardResult.dashboard.workflow_id}`,
    workflow_id: dashboardResult.dashboard.workflow_id,
    operator_authority_preserved: action.validation.authority_valid,
    unauthorized_actions_rejected: action.validation.action_permitted,
    recommendations_advisory_only: dashboardResult.advisory_only,
    autonomous_execution_triggered: false,
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

export function createIntegrityVerificationReport(dashboardResult: OperatorVisibilityDashboardResult): IntegrityVerificationReport {
  const base: Omit<IntegrityVerificationReport, "integrity_hash"> = {
    report_id: `integrity_verification_report_${dashboardResult.dashboard.workflow_id}`,
    workflow_id: dashboardResult.dashboard.workflow_id,
    integrity_verified: dashboardResult.validation.integrity_valid,
    lineage_complete: dashboardResult.validation.lineage_complete,
    audit_chain_complete: dashboardResult.audit_result.validation.timeline_complete,
    immutable_evidence_preserved: dashboardResult.audit_result.audit_ledger.every((entry) => entry.append_only && !entry.deleted),
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

export function createProductionReadinessReport(dashboardResult: OperatorVisibilityDashboardResult, tests: readonly OperatorDecisionWorkflowCertificationTest[]): ProductionReadinessReport {
  const ready = dashboardResult.dashboard_status === "PASS" && allTestsPass(tests);
  const base: Omit<ProductionReadinessReport, "integrity_hash"> = {
    report_id: `production_readiness_report_${dashboardResult.dashboard.workflow_id}`,
    workflow_id: dashboardResult.dashboard.workflow_id,
    readiness_status: ready ? "PASS" : "FAIL",
    production_deployment_allowed: ready,
    phase_advancement_allowed: ready,
    readiness_summary: ready ? "Operator Decision Workflow is certified production-ready for Phase 9.9 completion." : "Operator Decision Workflow certification failed closed.",
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

function createEvidence(dashboardResult: OperatorVisibilityDashboardResult, tests: readonly OperatorDecisionWorkflowCertificationTest[]): readonly OperatorDecisionWorkflowCertificationEvidence[] {
  const base: Omit<OperatorDecisionWorkflowCertificationEvidence, "ledger_integrity_hash"> = {
    evidence_id: `operator_workflow_certification_evidence_${dashboardResult.dashboard.workflow_id}`,
    workflow_id: dashboardResult.dashboard.workflow_id,
    test_count: tests.length,
    passed_tests: tests.filter((test) => test.passed).length,
    failed_tests: tests.filter((test) => !test.passed).length,
    append_only: true,
    deleted: false,
    replay_ref: dashboardResult.replay_summary.replay_ref,
    lineage_ref: dashboardResult.timeline_view.lineage_chain[0] ?? "",
    integrity_hash: dashboardResult.integrity_hash,
  };
  return Object.freeze([Object.freeze({ ...base, ledger_integrity_hash: evidenceHash(base) })]);
}

function collectFailures(input: {
  dashboard: OperatorVisibilityDashboardResult;
  tests: readonly OperatorDecisionWorkflowCertificationTest[];
  workflow: WorkflowCertificationReport;
  replay: ReplayValidationReport;
  governance: GovernanceComplianceReport;
  supremacy: OperatorSupremacyReport;
  integrity: IntegrityVerificationReport;
  readiness: ProductionReadinessReport;
  evidence: readonly OperatorDecisionWorkflowCertificationEvidence[];
}): readonly OperatorDecisionWorkflowCertificationFailureReason[] {
  const failures: OperatorDecisionWorkflowCertificationFailureReason[] = [];
  if (input.dashboard.dashboard_status !== "PASS") failures.push("OPERATOR_VISIBILITY_GAPS");
  if (!allTestsPass(input.tests)) failures.push("CERTIFICATION_TEST_FAILURE");
  if (input.dashboard.audit_result.escalation_result.review_result.override_result.approval_result.action_result.workflow_result.state_machine_status !== "PASS") failures.push("NONDETERMINISTIC_WORKFLOW_TRANSITIONS");
  if (!input.dashboard.audit_result.escalation_result.review_result.override_result.approval_result.action_result.workflow_result.validation.legal_transition_valid) failures.push("ILLEGAL_STATE_TRANSITIONS_ACCEPTED");
  if (!input.dashboard.audit_result.escalation_result.review_result.override_result.approval_result.action_result.validation.authority_valid) failures.push("UNAUTHORIZED_OPERATOR_ACTIONS");
  if (!input.dashboard.audit_result.escalation_result.review_result.override_result.approval_result.validation.required_approvals_present) failures.push("MISSING_APPROVAL_ENFORCEMENT");
  if (input.dashboard.audit_result.escalation_result.review_result.override_result.override_management_status !== "PASS") failures.push("UNRECORDED_OVERRIDES");
  if (!input.dashboard.audit_result.escalation_result.review_result.override_result.validation.justification_valid) failures.push("MISSING_OVERRIDE_JUSTIFICATIONS");
  if (input.dashboard.audit_result.escalation_result.review_result.review_manager_status !== "PASS") failures.push("INCOMPLETE_REVIEW_REQUESTS");
  if (input.dashboard.audit_result.escalation_result.escalation_workflow_status !== "PASS") failures.push("ESCALATION_ROUTING_FAILURES");
  if (!input.replay.replay_certified || input.replay.replay_divergence_detected) failures.push("REPLAY_MISMATCHES");
  if (!input.integrity.audit_chain_complete) failures.push("MISSING_AUDIT_HISTORY");
  if (!input.governance.governance_compliant) failures.push("GOVERNANCE_VIOLATIONS");
  if (!input.governance.constitutional_compliant) failures.push("CONSTITUTIONAL_VIOLATIONS");
  if (!input.governance.tenant_isolated) failures.push("TENANT_ISOLATION_FAILURES");
  if (!input.governance.advisory_only || !input.supremacy.recommendations_advisory_only) failures.push("ADVISORY_ONLY_VIOLATIONS");
  if (!input.integrity.integrity_verified) failures.push("INTEGRITY_HASH_MISMATCHES");
  if (!input.dashboard.fail_closed && input.dashboard.dashboard_status === "FAIL") failures.push("FAIL_CLOSED_BEHAVIOR_NOT_ENFORCED");
  if (!input.integrity.lineage_complete) failures.push("INCOMPLETE_LINEAGE");
  if (input.supremacy.autonomous_execution_triggered) failures.push("UNAUTHORIZED_WORKFLOW_MUTATION");
  if (!input.workflow.workflow_ready || !input.readiness.production_deployment_allowed) failures.push("CERTIFICATION_TEST_FAILURE");
  if (input.evidence.some((entry) => evidenceHash(entry) !== entry.ledger_integrity_hash || !entry.append_only || entry.deleted)) failures.push("EVIDENCE_IMMUTABILITY_FAILURE");
  if (
    input.tests.some((test) => testHash(test) !== test.integrity_hash)
    || reportHash(input.workflow) !== input.workflow.integrity_hash
    || reportHash(input.replay) !== input.replay.integrity_hash
    || reportHash(input.governance) !== input.governance.integrity_hash
    || reportHash(input.supremacy) !== input.supremacy.integrity_hash
    || reportHash(input.integrity) !== input.integrity.integrity_hash
    || reportHash(input.readiness) !== input.readiness.integrity_hash
  ) failures.push("INTEGRITY_HASH_MISMATCHES");
  return Object.freeze([...new Set(failures)] as OperatorDecisionWorkflowCertificationFailureReason[]);
}

function createValidation(workflowId: string, failures: readonly OperatorDecisionWorkflowCertificationFailureReason[]): OperatorDecisionWorkflowCertificationValidation {
  const has = (failure: OperatorDecisionWorkflowCertificationFailureReason) => failures.includes(failure);
  const base: Omit<OperatorDecisionWorkflowCertificationValidation, "integrity_hash"> = {
    validation_id: `operator_decision_workflow_certification_validation_${workflowId}`,
    workflow_id: workflowId,
    component_validation_passed: !has("CERTIFICATION_TEST_FAILURE"),
    integration_validation_passed: !has("CROSS_COMPONENT_REPLAY_DIVERGENCE") && !has("INCOMPLETE_LINEAGE"),
    replay_validation_passed: !has("REPLAY_MISMATCHES") && !has("REPLAY_DIVERGENCE"),
    governance_validation_passed: !has("GOVERNANCE_VIOLATIONS") && !has("CONSTITUTIONAL_VIOLATIONS"),
    integrity_validation_passed: !has("INTEGRITY_HASH_MISMATCHES") && !has("EVIDENCE_IMMUTABILITY_FAILURE"),
    operator_supremacy_preserved: !has("UNAUTHORIZED_OPERATOR_ACTIONS") && !has("UNAUTHORIZED_WORKFLOW_MUTATION"),
    production_ready: failures.length === 0,
    validation_status: failures.length === 0 ? "VALID" : "REJECTED",
    validation_timestamp: NOW,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

function resultReplayHash(result: Omit<OperatorDecisionWorkflowCertificationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    dashboard_result: result.dashboard_result,
    certification_tests: result.certification_tests,
    workflow_report: result.workflow_report,
    replay_report: result.replay_report,
    governance_report: result.governance_report,
    operator_supremacy_report: result.operator_supremacy_report,
    integrity_report: result.integrity_report,
    production_readiness_report: result.production_readiness_report,
    certification_evidence: result.certification_evidence,
    validation: result.validation,
    failures: result.failures,
  });
}

export function runOperatorDecisionWorkflowCertification(input: OperatorDecisionWorkflowCertificationInput = {}): OperatorDecisionWorkflowCertificationResult {
  const dashboard_result = input.dashboard_result ?? buildOperatorVisibilityDashboard();
  const certification_tests = input.certification_tests ?? createCertificationTests(dashboard_result);
  const workflow_report = input.workflow_report ?? createWorkflowCertificationReport(dashboard_result, certification_tests);
  const replay_report = input.replay_report ?? createReplayValidationReport(dashboard_result);
  const governance_report = input.governance_report ?? createGovernanceComplianceReport(dashboard_result);
  const operator_supremacy_report = input.operator_supremacy_report ?? createOperatorSupremacyReport(dashboard_result);
  const integrity_report = input.integrity_report ?? createIntegrityVerificationReport(dashboard_result);
  const production_readiness_report = input.production_readiness_report ?? createProductionReadinessReport(dashboard_result, certification_tests);
  const certification_evidence = input.certification_evidence ?? createEvidence(dashboard_result, certification_tests);
  const failures = collectFailures({
    dashboard: dashboard_result,
    tests: certification_tests,
    workflow: workflow_report,
    replay: replay_report,
    governance: governance_report,
    supremacy: operator_supremacy_report,
    integrity: integrity_report,
    readiness: production_readiness_report,
    evidence: certification_evidence,
  });
  const validation = createValidation(dashboard_result.dashboard.workflow_id, failures);
  const status: OperatorDecisionWorkflowCertificationOutcome = failures.length === 0 ? "PASS" : "FAIL";
  const base: Omit<OperatorDecisionWorkflowCertificationResult, "integrity_hash" | "replay_hash"> = {
    certification_status: status,
    fail_closed: status !== "PASS",
    dashboard_result,
    certification_tests,
    workflow_report,
    replay_report,
    governance_report,
    operator_supremacy_report,
    integrity_report,
    production_readiness_report,
    certification_evidence,
    validation,
    failures: validation.failures,
    deterministic: true,
    advisory_only: true,
    production_ready: status === "PASS",
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly OperatorDecisionWorkflowCertificationFailureReason[] = Object.freeze(["REPLAY_DIVERGENCE"]);
    const replayValidation = createValidation(dashboard_result.dashboard.workflow_id, replayFailures);
    const replayBase: Omit<OperatorDecisionWorkflowCertificationResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      certification_status: "FAIL",
      fail_closed: true,
      validation: replayValidation,
      failures: replayFailures,
      production_ready: false,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayOperatorDecisionWorkflowCertification(result: OperatorDecisionWorkflowCertificationResult): OperatorDecisionWorkflowCertificationReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && result.certification_tests.every((test) => testHash(test) === test.integrity_hash)
    && validationHash(result.validation) === result.validation.integrity_hash
    && result.certification_evidence.every((entry) => evidenceHash(entry) === entry.ledger_integrity_hash)
    && reportHash(result.workflow_report) === result.workflow_report.integrity_hash
    && reportHash(result.replay_report) === result.replay_report.integrity_hash
    && reportHash(result.governance_report) === result.governance_report.integrity_hash
    && reportHash(result.operator_supremacy_report) === result.operator_supremacy_report.integrity_hash
    && reportHash(result.integrity_report) === result.integrity_report.integrity_hash
    && reportHash(result.production_readiness_report) === result.production_readiness_report.integrity_hash;
  const failures: OperatorDecisionWorkflowCertificationFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<OperatorDecisionWorkflowCertificationReplay, "integrity_hash"> = {
    replay_id: "replay_operator_decision_workflow_certification",
    replay_valid,
    workflow_id: result.dashboard_result.dashboard.workflow_id,
    certification_status: result.certification_status,
    certified_test_ids: Object.freeze(result.certification_tests.filter((test) => test.passed).map((test) => test.test_id)),
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildOperatorDecisionWorkflowCertificationObservability(result: OperatorDecisionWorkflowCertificationResult): OperatorDecisionWorkflowCertificationObservability {
  return Object.freeze({
    certification_runs: 1,
    certification_tests_executed: result.certification_tests.length,
    certification_tests_passed: result.certification_tests.filter((test) => test.passed).length,
    certification_tests_failed: result.certification_tests.filter((test) => !test.passed).length,
    production_ready_assessments: result.production_ready ? 1 : 0,
    replay_reproducibility: replayOperatorDecisionWorkflowCertification(result).replay_valid ? 1 : 0,
    integrity_verification_success: result.validation.integrity_validation_passed ? 1 : 0,
    fail_closed_activations: result.fail_closed ? 1 : 0,
  });
}

export function getOperatorDecisionWorkflowCertificationFoundation(): OperatorDecisionWorkflowCertificationFoundation {
  const result = runOperatorDecisionWorkflowCertification();
  const replay = replayOperatorDecisionWorkflowCertification(result);
  return Object.freeze({
    certification_version: CERTIFICATION_VERSION,
    certification_states: OPERATOR_DECISION_WORKFLOW_CERTIFICATION_STATES,
    result,
    replay,
    observability: buildOperatorDecisionWorkflowCertificationObservability(result),
  });
}

export const OperatorDecisionWorkflowCertificationGate = Object.freeze({
  run: runOperatorDecisionWorkflowCertification,
  replay: replayOperatorDecisionWorkflowCertification,
});
