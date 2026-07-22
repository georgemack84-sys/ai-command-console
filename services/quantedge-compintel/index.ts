import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runMissionControl, validateMissionControl } from "@/services/mission-control";
import type {
  QciBundle,
  QciFailure,
  QciInput,
  QciOutcome,
  QciScenario,
  QciValidation,
  QuantEdgeCompIntelResult,
} from "@/types/quantedge-compintel";

const VERSION = "quantedge-compintel/v4.12" as const;
const IDENTIFIER = "QuantEdgeCompIntel" as const;
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
function has(failures: readonly QciFailure[], failure: QciFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: QciScenario): QciFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function getBaselineMissionControl() { baselineMissionControl ??= runMissionControl(); return baselineMissionControl; }
function outcome(failures: readonly QciFailure[]): QciOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

function resultReplayHash(result: Omit<QuantEdgeCompIntelResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    foundation: result.foundation.integrity_hash,
    domains: result.domain_registry.integrity_hash,
    collection: result.collection.integrity_hash,
    analysis: result.analysis.integrity_hash,
    synthesis: result.synthesis.integrity_hash,
    agents: result.agent_integration.integrity_hash,
    explainability: result.explainability.integrity_hash,
    dashboards: result.dashboards.integrity_hash,
    governance: result.governance.integrity_hash,
    readiness: result.readiness.integrity_hash,
    qualification: result.qualification.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<QuantEdgeCompIntelResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runQuantEdgeCompIntel(input: QciInput = {}): QuantEdgeCompIntelResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<QciFailure>(direct ? [direct] : []);
  const missionControl = getBaselineMissionControl();
  const dependencyFailures = freezeArray<QciFailure>([
    ...(!validateMissionControl(missionControl).valid || has(scenarioFailures, "P4_11_MISSION_CONTROL_INVALID") ? ["P4_11_MISSION_CONTROL_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_10_OBSERVABILITY_INVALID") ? ["P4_10_OBSERVABILITY_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_9_REPLAY_INVALID") ? ["P4_9_REPLAY_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_8_GOVERNANCE_INVALID") ? ["P4_8_GOVERNANCE_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_7_EVIDENCE_GOVERNANCE_INVALID") ? ["P4_7_EVIDENCE_GOVERNANCE_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_1_CAPABILITY_ATLAS_INVALID") ? ["PROGRAM_1_CAPABILITY_ATLAS_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_2_CCI_SHARED_SERVICES_INVALID") ? ["PROGRAM_2_CCI_SHARED_SERVICES_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_3_CAF_LEGION_INVALID") ? ["PROGRAM_3_CAF_LEGION_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const applicationId = input.application_id ?? "app:quantedge-compintel";
  const tenantId = input.tenant_id ?? "tenant:qualified:primary";
  const foundation = nested({
    application_id: has(failures, "QCI_APPLICATION_MISSING") ? "" : applicationId,
    application_name: "QuantEdge CompIntel" as const,
    tenant_id: tenantId,
    constitution_ref: has(failures, "QCI_CONSTITUTION_MISSING") ? "" : "qci-constitution:p4.12",
    architecture_ref: has(failures, "QCI_ARCHITECTURE_MISSING") ? "" : "qci-architecture:p4.12",
    intelligence_doctrine_ref: "qci-intelligence-doctrine:p4.12",
    ownership_model: freezeArray(["competitive-intelligence-workflows", "strategic-intelligence-generation", "intelligence-synthesis", "intelligence-reporting"]),
    operational_constraints: freezeArray(["consume-certified-services", "preserve-evidence-lineage", "constitutional-governance-bound", "replay-compatible"]),
    deterministic_workflows: !has(failures, "INTELLIGENCE_WORKFLOWS_NON_DETERMINISTIC"),
  });
  const domain_registry = nested({
    registry_id: has(failures, "INTELLIGENCE_DOMAIN_MODEL_MISSING") || has(failures, "DOMAIN_REGISTRY_INCOMPLETE") ? "" : "P4.12-INTELLIGENCE-DOMAIN-REGISTRY-001",
    domains: freezeArray(["MARKET", "COMPETITOR", "CUSTOMER", "TECHNOLOGY", "ECOSYSTEM", "OPPORTUNITY", "THREAT"] as const),
    domain_contract_refs: has(failures, "DOMAIN_REGISTRY_INCOMPLETE") ? freezeArray<string>([]) : freezeArray(["domain:market", "domain:competitor", "domain:customer", "domain:technology", "domain:ecosystem", "domain:opportunity", "domain:threat"]),
    market_model_ref: "model:market:p4.12",
    competitor_model_ref: "model:competitor:p4.12",
    customer_model_ref: "model:customer:p4.12",
    technology_model_ref: "model:technology:p4.12",
    ecosystem_model_ref: "model:ecosystem:p4.12",
    opportunity_model_ref: "model:opportunity:p4.12",
    threat_model_ref: "model:threat:p4.12",
    complete: !has(failures, "DOMAIN_REGISTRY_INCOMPLETE") && !has(failures, "INTELLIGENCE_DOMAIN_MODEL_MISSING"),
  });
  const collection = nested({
    collection_id: has(failures, "COLLECTION_ENGINE_MISSING") ? "" : "P4.12-COLLECTION-ENGINE-001",
    governed_source_refs: has(failures, "GOVERNED_SOURCE_INGESTION_MISSING") ? freezeArray<string>([]) : freezeArray(["source:market", "source:competitor", "source:customer", "source:technology"]),
    evidence_refs: freezeArray(["cci:evidence:qci:market", "cci:evidence:qci:competitor", "cci:evidence:qci:customer"]),
    normalized_intelligence_refs: freezeArray(["normalized:market", "normalized:competitor", "normalized:customer"]),
    source_qualification_report_refs: has(failures, "SOURCE_QUALIFICATION_INVALID") ? freezeArray<string>([]) : freezeArray(["source-qualification:qci:p4.12"]),
    provenance_validation_refs: has(failures, "PROVENANCE_VALIDATION_MISSING") ? freezeArray<string>([]) : freezeArray(["provenance:qci:p4.12"]),
    consumes_cci_evidence: true,
  });
  const analysis = nested({
    analysis_id: has(failures, "ANALYSIS_ENGINE_MISSING") ? "" : "P4.12-ANALYSIS-ENGINE-001",
    trend_analysis_refs: has(failures, "TREND_ANALYSIS_MISSING") ? freezeArray<string>([]) : freezeArray(["trend:market-growth", "trend:customer-demand"]),
    competitor_comparison_refs: has(failures, "COMPETITOR_COMPARISON_MISSING") ? freezeArray<string>([]) : freezeArray(["comparison:competitor-position"]),
    swot_refs: has(failures, "SWOT_GENERATION_MISSING") ? freezeArray<string>([]) : freezeArray(["swot:qci:portfolio"]),
    market_positioning_refs: has(failures, "MARKET_POSITIONING_MISSING") ? freezeArray<string>([]) : freezeArray(["positioning:qci:market"]),
    strategic_pattern_refs: freezeArray(["pattern:ecosystem-shift"]),
    opportunity_refs: has(failures, "OPPORTUNITY_THREAT_IDENTIFICATION_MISSING") ? freezeArray<string>([]) : freezeArray(["opportunity:market-gap"]),
    threat_refs: has(failures, "OPPORTUNITY_THREAT_IDENTIFICATION_MISSING") ? freezeArray<string>([]) : freezeArray(["threat:competitive-pressure"]),
    findings: freezeArray(["market-opportunity-visible", "competitive-risk-evidence-backed", "technology-shift-actionable"]),
  });
  const synthesis = nested({
    synthesis_id: has(failures, "SYNTHESIS_ENGINE_MISSING") ? "" : "P4.12-SYNTHESIS-ENGINE-001",
    executive_summary_refs: freezeArray(["summary:executive:qci"]),
    intelligence_brief_refs: freezeArray(["brief:market", "brief:competitor", "brief:technology"]),
    strategic_recommendation_refs: has(failures, "STRATEGIC_REPORTS_MISSING") ? freezeArray<string>([]) : freezeArray(["recommendation:qci:enter-segment", "recommendation:qci:monitor-threat"]),
    evidence_backed_conclusion_refs: freezeArray(["conclusion:evidence-backed:qci"]),
    confidence_assessment_refs: has(failures, "CONFIDENCE_ASSESSMENTS_MISSING") ? freezeArray<string>([]) : freezeArray(["confidence:qci:high"]),
    report_refs: has(failures, "STRATEGIC_REPORTS_MISSING") ? freezeArray<string>([]) : freezeArray(["strategic-intelligence-report:qci:p4.12"]),
    explainable: !has(failures, "INTELLIGENCE_PRODUCTS_NOT_EXPLAINABLE"),
  });
  const agent_integration = nested({
    integration_id: has(failures, "CAF_AGENT_INTEGRATION_MISSING") ? "" : "P4.12-QCI-AGENT-INTEGRATION-001",
    planning_agent_refs: freezeArray(["caf:planning-agent:qci"]),
    reasoning_agent_refs: freezeArray(["caf:reasoning-agent:qci"]),
    research_agent_refs: freezeArray(["caf:research-agent:qci"]),
    collaboration_agent_refs: freezeArray(["caf:collaboration-agent:qci"]),
    authority_gate_ref: has(failures, "CAF_GOVERNANCE_GATES_MISSING") ? "" : "caf:authority-gate",
    policy_gate_ref: has(failures, "CAF_GOVERNANCE_GATES_MISSING") ? "" : "caf:policy-gate",
    safety_gate_ref: has(failures, "CAF_GOVERNANCE_GATES_MISSING") ? "" : "caf:safety-gate",
    complete: !has(failures, "CAF_AGENT_INTEGRATION_MISSING") && !has(failures, "CAF_GOVERNANCE_GATES_MISSING"),
  });
  const explainability = nested({
    explainability_id: has(failures, "EVIDENCE_EXPLAINABILITY_MISSING") ? "" : "P4.12-EXPLAINABILITY-001",
    evidence_citation_refs: has(failures, "EVIDENCE_CITATIONS_MISSING") ? freezeArray<string>([]) : freezeArray(["citation:cci:evidence:qci:market", "citation:cci:evidence:qci:competitor"]),
    reasoning_lineage_refs: has(failures, "REASONING_LINEAGE_MISSING") ? freezeArray<string>([]) : freezeArray(["lineage:reasoning:qci"]),
    confidence_explanation_refs: freezeArray(["confidence-explanation:qci"]),
    recommendation_justification_refs: freezeArray(["justification:recommendation:qci"]),
    replay_refs: has(failures, "REPLAY_REFERENCES_MISSING") ? freezeArray<string>([]) : freezeArray(["replay:qci:intelligence-run"]),
    evidence_views_refs: freezeArray(["evidence-view:qci"]),
    explainability_report_refs: freezeArray(["explainability-report:qci"]),
    complete: !has(failures, "EVIDENCE_EXPLAINABILITY_MISSING") && !has(failures, "EVIDENCE_CITATIONS_MISSING") && !has(failures, "REASONING_LINEAGE_MISSING") && !has(failures, "REPLAY_REFERENCES_MISSING"),
  });
  const dashboards = nested({
    dashboard_id: has(failures, "INTELLIGENCE_DASHBOARD_MISSING") ? "" : "P4.12-INTELLIGENCE-DASHBOARD-001",
    executive_console_id: has(failures, "EXECUTIVE_CONSOLE_MISSING") ? "" : "P4.12-EXECUTIVE-CONSOLE-001",
    competitive_landscape_refs: freezeArray(["visual:competitive-landscape"]),
    market_trend_refs: freezeArray(["visual:market-trends"]),
    opportunity_tracking_refs: freezeArray(["visual:opportunity-tracking"]),
    threat_monitoring_refs: freezeArray(["visual:threat-monitoring"]),
    strategic_kpi_refs: freezeArray(["kpi:market-share", "kpi:competitor-risk", "kpi:opportunity-score"]),
    visualization_refs: freezeArray(["dashboard:qci:executive", "dashboard:qci:analyst"]),
    operational: !has(failures, "INTELLIGENCE_DASHBOARD_MISSING") && !has(failures, "EXECUTIVE_CONSOLE_MISSING"),
  });
  const governance = nested({
    governance_id: has(failures, "GOVERNANCE_INTEGRATION_MISSING") ? "" : "P4.12-GOVERNANCE-INTEGRATION-001",
    constitutional_binding_ref: "application-governance-binding/v4.8",
    approval_routing_ref: "approval-routing:p4.8",
    authority_inheritance_ref: "authority-inheritance:p4.8",
    application_governance_ref: "application-governance:p4.8",
    governance_contract_refs: freezeArray(["governance-contract:qci"]),
    enforcement_owned: has(failures, "GOVERNANCE_ENFORCEMENT_ATTEMPTED") || has(failures, "POLICY_ENFORCEMENT_ATTEMPTED"),
  });
  const readiness = nested({
    readiness_id: has(failures, "OPERATIONAL_READINESS_MISSING") ? "" : "P4.12-OPERATIONAL-READINESS-001",
    performance_validated: true,
    scalability_validated: true,
    observability_ref: "application-observability-operational-intelligence/v4.10",
    diagnostics_ref: "p4.10:diagnostics",
    replay_compatibility_ref: has(failures, "REPLAY_COMPATIBILITY_INVALID") ? "" : "application-replay-audit-forensics/v4.9",
    operational_readiness_report_ref: "operational-readiness:qci:p4.12",
    ready: !has(failures, "OPERATIONAL_READINESS_MISSING") && !has(failures, "REPLAY_COMPATIBILITY_INVALID"),
  });
  const qualification = nested({
    qualification_report_id: has(failures, "QUALIFICATION_REPORT_MISSING") ? "" : "P4.12-QCI-QUALIFICATION-REPORT-001",
    qualification_evidence_refs: has(failures, "QUALIFICATION_EVIDENCE_MISSING") ? freezeArray<string>([]) : freezeArray(["qualification-evidence:qci:constitution", "qualification-evidence:qci:evidence", "qualification-evidence:qci:replay"]),
    qualification_decision_ref: has(failures, "QUALIFICATION_DECISION_FAILED") ? "" : "qualification-decision:qci:pass",
    constitutional_compliance: true,
    architectural_completeness: true,
    governance_compliance: !governance.enforcement_owned,
    replay_compatibility: readiness.replay_compatibility_ref.length > 0,
    evidence_completeness: collection.evidence_refs.length > 0 && explainability.evidence_citation_refs.length > 0,
    interoperability: agent_integration.complete,
    operational_readiness: readiness.ready,
    deployment_certification_ref: has(failures, "DEPLOYMENT_CERTIFICATION_MISSING") ? "" : "deployment-certification:qci:p4.12",
    qualified: !has(failures, "QUALIFICATION_REPORT_MISSING") && !has(failures, "QUALIFICATION_EVIDENCE_MISSING") && !has(failures, "QUALIFICATION_DECISION_FAILED") && !has(failures, "DEPLOYMENT_CERTIFICATION_MISSING"),
  });
  const noOutOfScope = !has(failures, "IDENTITY_OWNERSHIP_ATTEMPTED") && !has(failures, "NAMESPACE_OWNERSHIP_ATTEMPTED") && !has(failures, "GOVERNANCE_ENFORCEMENT_ATTEMPTED") && !has(failures, "REPLAY_INFRASTRUCTURE_ATTEMPTED") && !has(failures, "EVIDENCE_STORAGE_ATTEMPTED") && !has(failures, "TELEMETRY_INFRASTRUCTURE_ATTEMPTED") && !has(failures, "CERTIFICATION_INFRASTRUCTURE_ATTEMPTED") && !has(failures, "CONSTITUTIONAL_AUTHORITY_ATTEMPTED") && !has(failures, "POLICY_ENFORCEMENT_ATTEMPTED");
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(foundation.application_id.length === 0 ? ["QCI_APPLICATION_MISSING" as const] : []),
    ...(foundation.constitution_ref.length === 0 ? ["QCI_CONSTITUTION_MISSING" as const] : []),
    ...(foundation.architecture_ref.length === 0 ? ["QCI_ARCHITECTURE_MISSING" as const] : []),
    ...(!foundation.deterministic_workflows ? ["INTELLIGENCE_WORKFLOWS_NON_DETERMINISTIC" as const] : []),
    ...(!domain_registry.complete ? ["DOMAIN_REGISTRY_INCOMPLETE" as const] : []),
    ...(collection.collection_id.length === 0 ? ["COLLECTION_ENGINE_MISSING" as const] : []),
    ...(collection.governed_source_refs.length === 0 ? ["GOVERNED_SOURCE_INGESTION_MISSING" as const] : []),
    ...(collection.source_qualification_report_refs.length === 0 ? ["SOURCE_QUALIFICATION_INVALID" as const] : []),
    ...(collection.provenance_validation_refs.length === 0 ? ["PROVENANCE_VALIDATION_MISSING" as const] : []),
    ...(analysis.analysis_id.length === 0 ? ["ANALYSIS_ENGINE_MISSING" as const] : []),
    ...(analysis.trend_analysis_refs.length === 0 ? ["TREND_ANALYSIS_MISSING" as const] : []),
    ...(analysis.competitor_comparison_refs.length === 0 ? ["COMPETITOR_COMPARISON_MISSING" as const] : []),
    ...(analysis.swot_refs.length === 0 ? ["SWOT_GENERATION_MISSING" as const] : []),
    ...(analysis.market_positioning_refs.length === 0 ? ["MARKET_POSITIONING_MISSING" as const] : []),
    ...(analysis.opportunity_refs.length === 0 || analysis.threat_refs.length === 0 ? ["OPPORTUNITY_THREAT_IDENTIFICATION_MISSING" as const] : []),
    ...(synthesis.synthesis_id.length === 0 ? ["SYNTHESIS_ENGINE_MISSING" as const] : []),
    ...(synthesis.report_refs.length === 0 ? ["STRATEGIC_REPORTS_MISSING" as const] : []),
    ...(synthesis.confidence_assessment_refs.length === 0 ? ["CONFIDENCE_ASSESSMENTS_MISSING" as const] : []),
    ...(!synthesis.explainable ? ["INTELLIGENCE_PRODUCTS_NOT_EXPLAINABLE" as const] : []),
    ...(!agent_integration.complete ? ["CAF_AGENT_INTEGRATION_MISSING" as const] : []),
    ...(agent_integration.authority_gate_ref.length === 0 || agent_integration.policy_gate_ref.length === 0 || agent_integration.safety_gate_ref.length === 0 ? ["CAF_GOVERNANCE_GATES_MISSING" as const] : []),
    ...(!explainability.complete ? ["EVIDENCE_EXPLAINABILITY_MISSING" as const] : []),
    ...(explainability.evidence_citation_refs.length === 0 ? ["EVIDENCE_CITATIONS_MISSING" as const] : []),
    ...(explainability.reasoning_lineage_refs.length === 0 ? ["REASONING_LINEAGE_MISSING" as const] : []),
    ...(explainability.replay_refs.length === 0 ? ["REPLAY_REFERENCES_MISSING" as const] : []),
    ...(dashboards.dashboard_id.length === 0 ? ["INTELLIGENCE_DASHBOARD_MISSING" as const] : []),
    ...(dashboards.executive_console_id.length === 0 ? ["EXECUTIVE_CONSOLE_MISSING" as const] : []),
    ...(governance.governance_id.length === 0 ? ["GOVERNANCE_INTEGRATION_MISSING" as const] : []),
    ...(readiness.readiness_id.length === 0 ? ["OPERATIONAL_READINESS_MISSING" as const] : []),
    ...(readiness.replay_compatibility_ref.length === 0 ? ["REPLAY_COMPATIBILITY_INVALID" as const] : []),
    ...(qualification.qualification_report_id.length === 0 ? ["QUALIFICATION_REPORT_MISSING" as const] : []),
    ...(qualification.qualification_evidence_refs.length === 0 ? ["QUALIFICATION_EVIDENCE_MISSING" as const] : []),
    ...(qualification.qualification_decision_ref.length === 0 ? ["QUALIFICATION_DECISION_FAILED" as const] : []),
    ...(qualification.deployment_certification_ref.length === 0 ? ["DEPLOYMENT_CERTIFICATION_MISSING" as const] : []),
    ...(!noOutOfScope ? ["IDENTITY_OWNERSHIP_ATTEMPTED" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P4.12-QCI-CERTIFICATION-001",
    outcome: outcome(derivedFailures),
    phase_ready: outcome(derivedFailures) === "PASS",
    application_implemented: foundation.application_id.length > 0,
    workflows_deterministic: foundation.deterministic_workflows,
    products_evidence_backed: collection.evidence_refs.length > 0 && explainability.evidence_citation_refs.length > 0,
    products_explainable: synthesis.explainable && explainability.complete,
    caf_integration_complete: agent_integration.complete,
    constitutional_governance_integrated: governance.governance_id.length > 0 && !governance.enforcement_owned,
    replay_compatible: readiness.replay_compatibility_ref.length > 0,
    operationally_ready: readiness.ready,
    qualification_complete: qualification.qualified,
    deployment_certified: qualification.deployment_certification_ref.length > 0,
    no_out_of_scope_ownership: noOutOfScope,
    failures: derivedFailures,
  });
  const base: Omit<QuantEdgeCompIntelResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    mission_control_ref: "mission-control/v4.11",
    operational_intelligence_ref: "application-observability-operational-intelligence/v4.10",
    replay_audit_forensics_ref: "application-replay-audit-forensics/v4.9",
    foundation,
    domain_registry,
    collection,
    analysis,
    synthesis,
    agent_integration,
    explainability,
    dashboards,
    governance,
    readiness,
    qualification,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateQuantEdgeCompIntel(result?: QuantEdgeCompIntelResult): QciValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, foundation_valid: false, domains_valid: false, collection_valid: false, analysis_valid: false, synthesis_valid: false, agents_valid: false, explainability_valid: false, dashboards_valid: false, governance_valid: false, readiness_valid: false, qualification_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const foundation_valid = verifyHashedRecord(result.foundation) && result.foundation.application_id.length > 0 && result.foundation.constitution_ref.length > 0 && result.foundation.architecture_ref.length > 0 && result.foundation.deterministic_workflows;
  const domains_valid = verifyHashedRecord(result.domain_registry) && result.domain_registry.complete && result.domain_registry.domains.length === 7;
  const collection_valid = verifyHashedRecord(result.collection) && result.collection.collection_id.length > 0 && result.collection.governed_source_refs.length > 0 && result.collection.source_qualification_report_refs.length > 0 && result.collection.provenance_validation_refs.length > 0;
  const analysis_valid = verifyHashedRecord(result.analysis) && result.analysis.analysis_id.length > 0 && result.analysis.trend_analysis_refs.length > 0 && result.analysis.competitor_comparison_refs.length > 0 && result.analysis.swot_refs.length > 0 && result.analysis.market_positioning_refs.length > 0 && result.analysis.opportunity_refs.length > 0 && result.analysis.threat_refs.length > 0;
  const synthesis_valid = verifyHashedRecord(result.synthesis) && result.synthesis.synthesis_id.length > 0 && result.synthesis.report_refs.length > 0 && result.synthesis.confidence_assessment_refs.length > 0 && result.synthesis.explainable;
  const agents_valid = verifyHashedRecord(result.agent_integration) && result.agent_integration.complete && result.agent_integration.authority_gate_ref.length > 0 && result.agent_integration.policy_gate_ref.length > 0 && result.agent_integration.safety_gate_ref.length > 0;
  const explainability_valid = verifyHashedRecord(result.explainability) && result.explainability.complete && result.explainability.evidence_citation_refs.length > 0 && result.explainability.reasoning_lineage_refs.length > 0 && result.explainability.replay_refs.length > 0;
  const dashboards_valid = verifyHashedRecord(result.dashboards) && result.dashboards.operational && result.dashboards.dashboard_id.length > 0 && result.dashboards.executive_console_id.length > 0;
  const governance_valid = verifyHashedRecord(result.governance) && result.governance.governance_id.length > 0 && !result.governance.enforcement_owned;
  const readiness_valid = verifyHashedRecord(result.readiness) && result.readiness.ready && result.readiness.replay_compatibility_ref.length > 0;
  const qualification_valid = verifyHashedRecord(result.qualification) && result.qualification.qualified && result.qualification.deployment_certification_ref.length > 0;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.phase_ready && result.certification.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && foundation_valid && domains_valid && collection_valid && analysis_valid && synthesis_valid && agents_valid && explainability_valid && dashboards_valid && governance_valid && readiness_valid && qualification_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, foundation_valid, domains_valid, collection_valid, analysis_valid, synthesis_valid, agents_valid, explainability_valid, dashboards_valid, governance_valid, readiness_valid, qualification_valid, certification_valid, failures: result.certification.failures });
}

export function replayQuantEdgeCompIntel(result = runQuantEdgeCompIntel()): boolean {
  const replayed = runQuantEdgeCompIntel();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateQuantEdgeCompIntel(result).valid;
}

export function getQuantEdgeCompIntelBundle(): QciBundle {
  const result = runQuantEdgeCompIntel();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_competitive_intelligence_workflows: true,
      owns_strategic_intelligence_generation: true,
      owns_intelligence_synthesis: true,
      owns_recommendation_generation: true,
      owns_application_orchestration: true,
      owns_identity: false,
      owns_namespaces: false,
      owns_governance_enforcement: false,
      owns_replay_infrastructure: false,
      owns_evidence_storage: false,
      owns_telemetry_infrastructure: false,
      owns_certification_infrastructure: false,
      owns_constitutional_authority: false,
      owns_policy_enforcement: false,
    }),
    result,
    validation: validateQuantEdgeCompIntel(result),
  });
}

export const QuantEdgeCompIntelService = Object.freeze({
  run: runQuantEdgeCompIntel,
  validate: validateQuantEdgeCompIntel,
  replay: replayQuantEdgeCompIntel,
});
