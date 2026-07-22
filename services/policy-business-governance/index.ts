import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runMissionControl, validateMissionControl } from "@/services/mission-control";
import { runQuantEdgeCompIntel, validateQuantEdgeCompIntel } from "@/services/quantedge-compintel";
import type {
  PbgBundle,
  PbgFailure,
  PbgInput,
  PbgOutcome,
  PbgScenario,
  PbgValidation,
  PolicyBusinessGovernanceResult,
} from "@/types/policy-business-governance";

const VERSION = "policy-business-governance/v4.13" as const;
const IDENTIFIER = "PolicyBusinessGovernance" as const;
let baselineQci: ReturnType<typeof runQuantEdgeCompIntel> | undefined;
let baselineMissionControl: ReturnType<typeof runMissionControl> | undefined;

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
function has(failures: readonly PbgFailure[], failure: PbgFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: PbgScenario): PbgFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function getBaselineQci() { baselineQci ??= runQuantEdgeCompIntel(); return baselineQci; }
function getBaselineMissionControl() { baselineMissionControl ??= runMissionControl(); return baselineMissionControl; }
function outcome(failures: readonly PbgFailure[]): PbgOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

function resultReplayHash(result: Omit<PolicyBusinessGovernanceResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    foundation: result.foundation.integrity_hash,
    organization: result.organization.integrity_hash,
    lifecycle: result.lifecycle.integrity_hash,
    rules: result.rules.integrity_hash,
    workflows: result.workflows.integrity_hash,
    governance: result.organizational_governance.integrity_hash,
    catalog: result.catalog.integrity_hash,
    notifications: result.notifications.integrity_hash,
    reporting: result.reporting.integrity_hash,
    integration: result.integration.integrity_hash,
    readiness: result.readiness.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<PolicyBusinessGovernanceResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runPolicyBusinessGovernance(input: PbgInput = {}): PolicyBusinessGovernanceResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<PbgFailure>(direct ? [direct] : []);
  const qci = getBaselineQci();
  const missionControl = getBaselineMissionControl();
  const dependencyFailures = freezeArray<PbgFailure>([
    ...(!validateQuantEdgeCompIntel(qci).valid || has(scenarioFailures, "P4_12_QCI_INVALID") ? ["P4_12_QCI_INVALID" as const] : []),
    ...(!validateMissionControl(missionControl).valid || has(scenarioFailures, "P4_11_MISSION_CONTROL_INVALID") ? ["P4_11_MISSION_CONTROL_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_1_GOVERNANCE_INVALID") ? ["PROGRAM_1_GOVERNANCE_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_2_CCI_SERVICES_INVALID") ? ["PROGRAM_2_CCI_SERVICES_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_3_CAF_GATES_INVALID") ? ["PROGRAM_3_CAF_GATES_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const applicationId = input.application_id ?? "app:policy-business-governance";
  const tenantId = input.tenant_id ?? "tenant:qualified:primary";
  const foundation = nested({
    application_id: has(failures, "PBG_APPLICATION_MISSING") ? "" : applicationId,
    application_name: "Policy & Business Governance" as const,
    tenant_id: tenantId,
    foundation_ref: has(failures, "APPLICATION_FOUNDATION_MISSING") ? "" : "pbg:foundation:p4.13",
    governance_domain_model_ref: has(failures, "GOVERNANCE_DOMAIN_MODEL_MISSING") ? "" : "pbg:governance-domain-model",
    service_architecture_ref: has(failures, "SERVICE_ARCHITECTURE_MISSING") ? "" : "pbg:service-architecture",
    configuration_ref: has(failures, "APPLICATION_CONFIGURATION_MISSING") ? "" : "pbg:application-configuration",
    boundaries_verified: !has(failures, "CONSTITUTIONAL_SEPARATION_VIOLATED"),
  });
  const organization = nested({
    organization_registry_id: has(failures, "ORGANIZATION_REGISTRY_MISSING") ? "" : "P4.13-ORGANIZATION-REGISTRY-001",
    governance_hierarchy_ref: has(failures, "GOVERNANCE_HIERARCHY_MISSING") ? "" : "pbg:governance-hierarchy",
    ownership_model_ref: "pbg:ownership-model",
    departments: freezeArray(["legal", "risk", "operations", "finance"]),
    committees: freezeArray(["policy-review-board", "enterprise-governance-committee"]),
    ownership_lineage_refs: has(failures, "OWNERSHIP_LINEAGE_INCOMPLETE") ? freezeArray<string>([]) : freezeArray(["lineage:policy-owner", "lineage:committee-owner"]),
    operational: !has(failures, "ORGANIZATION_REGISTRY_MISSING") && !has(failures, "GOVERNANCE_HIERARCHY_MISSING"),
  });
  const lifecycle = nested({
    policy_registry_id: has(failures, "POLICY_REGISTRY_MISSING") ? "" : "P4.13-POLICY-REGISTRY-001",
    lifecycle_engine_ref: "pbg:policy-lifecycle-engine",
    version_history_refs: has(failures, "POLICY_VERSION_LINEAGE_INCOMPLETE") ? freezeArray<string>([]) : freezeArray(["policy-version:v1", "policy-version:v2"]),
    lifecycle_states: freezeArray(["DRAFT", "REVIEW", "PUBLISHED", "RETIRED", "SUPERSEDED"] as const),
    deterministic: !has(failures, "POLICY_LIFECYCLE_NON_DETERMINISTIC"),
    version_lineage_complete: !has(failures, "POLICY_VERSION_LINEAGE_INCOMPLETE"),
  });
  const rules = nested({
    rule_registry_id: has(failures, "BUSINESS_RULE_REGISTRY_MISSING") ? "" : "P4.13-BUSINESS-RULE-REGISTRY-001",
    policy_catalog_ref: has(failures, "POLICY_CATALOG_MISSING") ? "" : "pbg:policy-catalog",
    rule_library_ref: has(failures, "RULE_LIBRARY_MISSING") ? "" : "pbg:rule-library",
    organizational_policy_refs: freezeArray(["policy:travel", "policy:data-handling", "policy:vendor-risk"]),
    operational_standard_refs: freezeArray(["standard:review-cycle", "standard:publication"]),
    caf_policy_gate_ref: "caf:policy-gate",
    constitutional_separation_maintained: !has(failures, "CONSTITUTIONAL_SEPARATION_VIOLATED") && !has(failures, "POLICY_ENFORCEMENT_ATTEMPTED"),
  });
  const workflows = nested({
    workflow_engine_id: has(failures, "WORKFLOW_ENGINE_MISSING") ? "" : "P4.13-GOVERNANCE-WORKFLOW-ENGINE-001",
    approval_pipeline_ref: has(failures, "APPROVAL_PIPELINE_MISSING") ? "" : "pbg:approval-pipeline",
    decision_history_ref: has(failures, "DECISION_HISTORY_MISSING") ? "" : "pbg:decision-history",
    caf_approval_framework_ref: "caf:approval-framework",
    routing_deterministic: !has(failures, "APPROVAL_ROUTING_NON_DETERMINISTIC"),
    approvals_tracked: !has(failures, "APPROVAL_PIPELINE_MISSING") && !has(failures, "DECISION_HISTORY_MISSING"),
  });
  const organizational_governance = nested({
    governance_record_id: has(failures, "ORGANIZATIONAL_GOVERNANCE_MISSING") ? "" : "P4.13-ORGANIZATIONAL-GOVERNANCE-001",
    review_registry_ref: "pbg:review-registry",
    decision_ledger_ref: "pbg:decision-ledger",
    committee_decision_refs: freezeArray(["committee-decision:policy-review"]),
    governance_meeting_refs: freezeArray(["meeting:governance:weekly"]),
    evidence_refs: has(failures, "GOVERNANCE_EVIDENCE_INCOMPLETE") ? freezeArray<string>([]) : freezeArray(["caf:governance-evidence", "cci:evidence:pbg"]),
    operational: !has(failures, "ORGANIZATIONAL_GOVERNANCE_MISSING"),
  });
  const catalog = nested({
    catalog_id: has(failures, "POLICY_DISCOVERY_MISSING") || has(failures, "POLICY_CATALOG_MISSING") ? "" : "P4.13-POLICY-CATALOG-001",
    search_service_ref: has(failures, "POLICY_DISCOVERY_MISSING") ? "" : "pbg:governance-search",
    policy_index_ref: has(failures, "POLICY_INDEX_INCOMPLETE") ? "" : "pbg:policy-index",
    discoverable_policy_refs: freezeArray(["policy:travel", "policy:data-handling", "policy:vendor-risk"]),
    complete: !has(failures, "POLICY_DISCOVERY_MISSING") && !has(failures, "POLICY_INDEX_INCOMPLETE") && !has(failures, "POLICY_CATALOG_MISSING"),
  });
  const notifications = nested({
    notification_service_id: has(failures, "NOTIFICATION_SERVICE_MISSING") ? "" : "P4.13-NOTIFICATION-SERVICE-001",
    subscription_registry_ref: "pbg:subscription-registry",
    alert_manager_ref: "pbg:alert-manager",
    notification_refs: freezeArray(["notification:approval", "notification:publication", "notification:review-reminder"]),
    cci_notification_infrastructure_ref: "cci:notification-infrastructure",
    delivery_tracked: !has(failures, "DELIVERY_TRACKING_MISSING"),
  });
  const reporting = nested({
    dashboard_id: has(failures, "GOVERNANCE_DASHBOARD_MISSING") ? "" : "P4.13-GOVERNANCE-DASHBOARD-001",
    analytics_ref: "pbg:policy-analytics",
    report_refs: has(failures, "REPORTING_INCOMPLETE") ? freezeArray<string>([]) : freezeArray(["report:policy-status", "report:approval-metrics", "report:organization-governance"]),
    approval_metric_refs: freezeArray(["metric:approval-cycle-time", "metric:publication-rate"]),
    organizational_report_refs: freezeArray(["org-report:committee-decisions"]),
    visible: !has(failures, "GOVERNANCE_DASHBOARD_MISSING"),
    complete: !has(failures, "REPORTING_INCOMPLETE"),
  });
  const integration = nested({
    integration_id: has(failures, "INTEGRATION_CONTRACTS_INVALID") ? "" : "P4.13-INTEGRATION-CONTRACTS-001",
    cci_contract_refs: freezeArray(["cci:identity", "cci:registry", "cci:evidence", "cci:notification", "cci:lifecycle"]),
    caf_contract_refs: freezeArray(["caf:authority-gate", "caf:policy-gate", "caf:safety-gate", "caf:approval-framework"]),
    mission_control_contract_refs: freezeArray(["mission-control:governance-workspace"]),
    ecosystem_application_refs: freezeArray(["ecosystem:application-registry", qci.foundation.application_id]),
    validated: !has(failures, "INTEGRATION_CONTRACTS_INVALID"),
    interoperable: !has(failures, "INTEROPERABILITY_INVALID"),
  });
  const readiness = nested({
    readiness_id: has(failures, "READINESS_ASSESSMENT_MISSING") ? "" : "P4.13-READINESS-ASSESSMENT-001",
    operational_dashboard_ref: has(failures, "OBSERVABILITY_DIAGNOSTICS_MISSING") ? "" : "pbg:operational-dashboard",
    diagnostics_ref: has(failures, "OBSERVABILITY_DIAGNOSTICS_MISSING") ? "" : "pbg:diagnostics",
    health_report_ref: "pbg:health-report",
    workflow_monitoring_ref: has(failures, "WORKFLOW_MONITORING_MISSING") ? "" : "pbg:workflow-monitoring",
    readiness_assessment_ref: "pbg:readiness-assessment",
    certification_evidence_refs: has(failures, "CERTIFICATION_EVIDENCE_MISSING") ? freezeArray<string>([]) : freezeArray(["evidence:pbg:constitution", "evidence:pbg:lifecycle", "evidence:pbg:workflow"]),
    validation_report_refs: has(failures, "VALIDATION_REPORTS_MISSING") ? freezeArray<string>([]) : freezeArray(["validation:pbg:workflow", "validation:pbg:integration"]),
    consumer_readiness_ref: has(failures, "CONSUMER_READINESS_MISSING") ? "" : "consumer-readiness:pbg",
    evidence_accepted: !has(failures, "CERTIFICATION_EVIDENCE_MISSING"),
  });
  const noOutOfScope = !has(failures, "CONSTITUTIONAL_GOVERNANCE_OWNERSHIP_ATTEMPTED") && !has(failures, "AUTHORITY_GATE_OWNERSHIP_ATTEMPTED") && !has(failures, "POLICY_GATE_OWNERSHIP_ATTEMPTED") && !has(failures, "SAFETY_GATE_OWNERSHIP_ATTEMPTED") && !has(failures, "POLICY_ENFORCEMENT_ATTEMPTED") && !has(failures, "REPLAY_INFRASTRUCTURE_ATTEMPTED") && !has(failures, "EVIDENCE_STORAGE_ATTEMPTED") && !has(failures, "IDENTITY_INFRASTRUCTURE_ATTEMPTED");
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(foundation.application_id.length === 0 ? ["PBG_APPLICATION_MISSING" as const] : []),
    ...(foundation.foundation_ref.length === 0 ? ["APPLICATION_FOUNDATION_MISSING" as const] : []),
    ...(foundation.governance_domain_model_ref.length === 0 ? ["GOVERNANCE_DOMAIN_MODEL_MISSING" as const] : []),
    ...(foundation.service_architecture_ref.length === 0 ? ["SERVICE_ARCHITECTURE_MISSING" as const] : []),
    ...(foundation.configuration_ref.length === 0 ? ["APPLICATION_CONFIGURATION_MISSING" as const] : []),
    ...(!foundation.boundaries_verified ? ["CONSTITUTIONAL_SEPARATION_VIOLATED" as const] : []),
    ...(organization.organization_registry_id.length === 0 ? ["ORGANIZATION_REGISTRY_MISSING" as const] : []),
    ...(organization.governance_hierarchy_ref.length === 0 ? ["GOVERNANCE_HIERARCHY_MISSING" as const] : []),
    ...(organization.ownership_lineage_refs.length === 0 ? ["OWNERSHIP_LINEAGE_INCOMPLETE" as const] : []),
    ...(lifecycle.policy_registry_id.length === 0 ? ["POLICY_REGISTRY_MISSING" as const] : []),
    ...(!lifecycle.deterministic ? ["POLICY_LIFECYCLE_NON_DETERMINISTIC" as const] : []),
    ...(!lifecycle.version_lineage_complete ? ["POLICY_VERSION_LINEAGE_INCOMPLETE" as const] : []),
    ...(rules.rule_registry_id.length === 0 ? ["BUSINESS_RULE_REGISTRY_MISSING" as const] : []),
    ...(rules.policy_catalog_ref.length === 0 ? ["POLICY_CATALOG_MISSING" as const] : []),
    ...(rules.rule_library_ref.length === 0 ? ["RULE_LIBRARY_MISSING" as const] : []),
    ...(!rules.constitutional_separation_maintained ? ["CONSTITUTIONAL_SEPARATION_VIOLATED" as const] : []),
    ...(workflows.workflow_engine_id.length === 0 ? ["WORKFLOW_ENGINE_MISSING" as const] : []),
    ...(!workflows.routing_deterministic ? ["APPROVAL_ROUTING_NON_DETERMINISTIC" as const] : []),
    ...(workflows.approval_pipeline_ref.length === 0 ? ["APPROVAL_PIPELINE_MISSING" as const] : []),
    ...(workflows.decision_history_ref.length === 0 ? ["DECISION_HISTORY_MISSING" as const] : []),
    ...(organizational_governance.governance_record_id.length === 0 ? ["ORGANIZATIONAL_GOVERNANCE_MISSING" as const] : []),
    ...(organizational_governance.evidence_refs.length === 0 ? ["GOVERNANCE_EVIDENCE_INCOMPLETE" as const] : []),
    ...(!catalog.complete ? ["POLICY_DISCOVERY_MISSING" as const] : []),
    ...(catalog.policy_index_ref.length === 0 ? ["POLICY_INDEX_INCOMPLETE" as const] : []),
    ...(notifications.notification_service_id.length === 0 ? ["NOTIFICATION_SERVICE_MISSING" as const] : []),
    ...(!notifications.delivery_tracked ? ["DELIVERY_TRACKING_MISSING" as const] : []),
    ...(reporting.dashboard_id.length === 0 ? ["GOVERNANCE_DASHBOARD_MISSING" as const] : []),
    ...(!reporting.complete ? ["REPORTING_INCOMPLETE" as const] : []),
    ...(!integration.validated ? ["INTEGRATION_CONTRACTS_INVALID" as const] : []),
    ...(!integration.interoperable ? ["INTEROPERABILITY_INVALID" as const] : []),
    ...(readiness.operational_dashboard_ref.length === 0 || readiness.diagnostics_ref.length === 0 ? ["OBSERVABILITY_DIAGNOSTICS_MISSING" as const] : []),
    ...(readiness.workflow_monitoring_ref.length === 0 ? ["WORKFLOW_MONITORING_MISSING" as const] : []),
    ...(readiness.readiness_id.length === 0 ? ["READINESS_ASSESSMENT_MISSING" as const] : []),
    ...(readiness.certification_evidence_refs.length === 0 ? ["CERTIFICATION_EVIDENCE_MISSING" as const] : []),
    ...(readiness.validation_report_refs.length === 0 ? ["VALIDATION_REPORTS_MISSING" as const] : []),
    ...(readiness.consumer_readiness_ref.length === 0 ? ["CONSUMER_READINESS_MISSING" as const] : []),
    ...(!noOutOfScope ? ["CONSTITUTIONAL_GOVERNANCE_OWNERSHIP_ATTEMPTED" as const] : []),
    ...(has(failures, "PRODUCTION_DEPLOYMENT_NOT_READY") ? ["PRODUCTION_DEPLOYMENT_NOT_READY" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P4.13-PBG-CERTIFICATION-001",
    outcome: outcome(derivedFailures),
    phase_ready: outcome(derivedFailures) === "PASS",
    constitutionally_compliant: foundation.boundaries_verified && rules.constitutional_separation_maintained,
    organizational_governance_operational: organization.operational && organizational_governance.operational,
    policy_lifecycle_operational: lifecycle.policy_registry_id.length > 0 && lifecycle.deterministic && lifecycle.version_lineage_complete,
    business_rules_managed: rules.rule_registry_id.length > 0 && rules.policy_catalog_ref.length > 0 && rules.rule_library_ref.length > 0,
    workflows_deterministic: workflows.workflow_engine_id.length > 0 && workflows.routing_deterministic,
    approvals_tracked: workflows.approvals_tracked,
    governance_reporting_complete: reporting.visible && reporting.complete,
    integrations_validated: integration.validated && integration.interoperable,
    evidence_lineage_complete: organizational_governance.evidence_refs.length > 0 && readiness.certification_evidence_refs.length > 0,
    replay_compatible: true,
    operationally_ready: readiness.readiness_id.length > 0 && readiness.operational_dashboard_ref.length > 0 && readiness.diagnostics_ref.length > 0,
    production_deployment_ready: !has(derivedFailures, "PRODUCTION_DEPLOYMENT_NOT_READY"),
    no_out_of_scope_ownership: noOutOfScope,
    failures: derivedFailures,
  });
  const base: Omit<PolicyBusinessGovernanceResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    qci_ref: "quantedge-compintel/v4.12",
    mission_control_ref: "mission-control/v4.11",
    foundation,
    organization,
    lifecycle,
    rules,
    workflows,
    organizational_governance,
    catalog,
    notifications,
    reporting,
    integration,
    readiness,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validatePolicyBusinessGovernance(result?: PolicyBusinessGovernanceResult): PbgValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, foundation_valid: false, organization_valid: false, lifecycle_valid: false, rules_valid: false, workflows_valid: false, governance_valid: false, catalog_valid: false, notifications_valid: false, reporting_valid: false, integration_valid: false, readiness_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const foundation_valid = verifyHashedRecord(result.foundation) && result.foundation.application_id.length > 0 && result.foundation.foundation_ref.length > 0 && result.foundation.boundaries_verified;
  const organization_valid = verifyHashedRecord(result.organization) && result.organization.operational && result.organization.ownership_lineage_refs.length > 0;
  const lifecycle_valid = verifyHashedRecord(result.lifecycle) && result.lifecycle.policy_registry_id.length > 0 && result.lifecycle.deterministic && result.lifecycle.version_lineage_complete;
  const rules_valid = verifyHashedRecord(result.rules) && result.rules.rule_registry_id.length > 0 && result.rules.policy_catalog_ref.length > 0 && result.rules.rule_library_ref.length > 0 && result.rules.constitutional_separation_maintained;
  const workflows_valid = verifyHashedRecord(result.workflows) && result.workflows.workflow_engine_id.length > 0 && result.workflows.routing_deterministic && result.workflows.approvals_tracked;
  const governance_valid = verifyHashedRecord(result.organizational_governance) && result.organizational_governance.operational && result.organizational_governance.evidence_refs.length > 0;
  const catalog_valid = verifyHashedRecord(result.catalog) && result.catalog.complete && result.catalog.policy_index_ref.length > 0;
  const notifications_valid = verifyHashedRecord(result.notifications) && result.notifications.notification_service_id.length > 0 && result.notifications.delivery_tracked;
  const reporting_valid = verifyHashedRecord(result.reporting) && result.reporting.visible && result.reporting.complete;
  const integration_valid = verifyHashedRecord(result.integration) && result.integration.validated && result.integration.interoperable;
  const readiness_valid = verifyHashedRecord(result.readiness) && result.readiness.readiness_id.length > 0 && result.readiness.evidence_accepted && result.readiness.validation_report_refs.length > 0 && result.readiness.consumer_readiness_ref.length > 0;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.phase_ready && result.certification.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && foundation_valid && organization_valid && lifecycle_valid && rules_valid && workflows_valid && governance_valid && catalog_valid && notifications_valid && reporting_valid && integration_valid && readiness_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, foundation_valid, organization_valid, lifecycle_valid, rules_valid, workflows_valid, governance_valid, catalog_valid, notifications_valid, reporting_valid, integration_valid, readiness_valid, certification_valid, failures: result.certification.failures });
}

export function replayPolicyBusinessGovernance(result = runPolicyBusinessGovernance()): boolean {
  const replayed = runPolicyBusinessGovernance();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validatePolicyBusinessGovernance(result).valid;
}

export function getPolicyBusinessGovernanceBundle(): PbgBundle {
  const result = runPolicyBusinessGovernance();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_business_policy_management: true,
      owns_governance_workflow_management: true,
      owns_organizational_approval_processes: true,
      owns_policy_lifecycle_management: true,
      owns_governance_reporting: true,
      owns_constitutional_governance: false,
      owns_authority_gate: false,
      owns_policy_gate: false,
      owns_safety_gate: false,
      owns_policy_enforcement: false,
      owns_replay_infrastructure: false,
      owns_evidence_storage: false,
      owns_identity_infrastructure: false,
    }),
    result,
    validation: validatePolicyBusinessGovernance(result),
  });
}

export const PolicyBusinessGovernanceService = Object.freeze({
  run: runPolicyBusinessGovernance,
  validate: validatePolicyBusinessGovernance,
  replay: replayPolicyBusinessGovernance,
});
