import { describe, expect, it } from "vitest";
import {
  getQuantEdgeCompIntelBundle,
  replayQuantEdgeCompIntel,
  runQuantEdgeCompIntel,
  validateQuantEdgeCompIntel,
} from "@/services/quantedge-compintel";
import type { QciScenario } from "@/types/quantedge-compintel";

describe("Program 4 P4.12 QuantEdge CompIntel", () => {
  it("publishes QCI doctrine without owning Programs 1-3 infrastructure", () => {
    const bundle = getQuantEdgeCompIntelBundle();

    expect(bundle.doctrine.version).toBe("quantedge-compintel/v4.12");
    expect(bundle.doctrine.owns_competitive_intelligence_workflows).toBe(true);
    expect(bundle.doctrine.owns_strategic_intelligence_generation).toBe(true);
    expect(bundle.doctrine.owns_intelligence_synthesis).toBe(true);
    expect(bundle.doctrine.owns_recommendation_generation).toBe(true);
    expect(bundle.doctrine.owns_application_orchestration).toBe(true);
    expect(bundle.doctrine.owns_identity).toBe(false);
    expect(bundle.doctrine.owns_namespaces).toBe(false);
    expect(bundle.doctrine.owns_governance_enforcement).toBe(false);
    expect(bundle.doctrine.owns_replay_infrastructure).toBe(false);
    expect(bundle.doctrine.owns_evidence_storage).toBe(false);
    expect(bundle.doctrine.owns_telemetry_infrastructure).toBe(false);
    expect(bundle.doctrine.owns_certification_infrastructure).toBe(false);
    expect(bundle.doctrine.owns_constitutional_authority).toBe(false);
    expect(bundle.doctrine.owns_policy_enforcement).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("builds deterministic competitive intelligence workflows and products", () => {
    const first = runQuantEdgeCompIntel();
    const second = runQuantEdgeCompIntel();

    expect(first.mission_control_ref).toBe("mission-control/v4.11");
    expect(first.foundation.application_name).toBe("QuantEdge CompIntel");
    expect(first.foundation.deterministic_workflows).toBe(true);
    expect(first.domain_registry.domains).toEqual(["MARKET", "COMPETITOR", "CUSTOMER", "TECHNOLOGY", "ECOSYSTEM", "OPPORTUNITY", "THREAT"]);
    expect(first.collection.consumes_cci_evidence).toBe(true);
    expect(first.analysis.findings.length).toBeGreaterThan(0);
    expect(first.synthesis.explainable).toBe(true);
    expect(first.agent_integration.complete).toBe(true);
    expect(first.explainability.complete).toBe(true);
    expect(first.dashboards.operational).toBe(true);
    expect(first.governance.enforcement_owned).toBe(false);
    expect(first.readiness.ready).toBe(true);
    expect(first.qualification.qualified).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateQuantEdgeCompIntel(first).valid).toBe(true);
    expect(replayQuantEdgeCompIntel(first)).toBe(true);
  });

  it("certifies QCI deployment readiness, explainability, replay compatibility, and governance boundaries", () => {
    const result = runQuantEdgeCompIntel();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.application_implemented).toBe(true);
    expect(result.certification.workflows_deterministic).toBe(true);
    expect(result.certification.products_evidence_backed).toBe(true);
    expect(result.certification.products_explainable).toBe(true);
    expect(result.certification.caf_integration_complete).toBe(true);
    expect(result.certification.constitutional_governance_integrated).toBe(true);
    expect(result.certification.replay_compatible).toBe(true);
    expect(result.certification.operationally_ready).toBe(true);
    expect(result.certification.qualification_complete).toBe(true);
    expect(result.certification.deployment_certified).toBe(true);
    expect(result.certification.no_out_of_scope_ownership).toBe(true);
  });

  it.each([
    "P4_11_MISSION_CONTROL_INVALID",
    "P4_10_OBSERVABILITY_INVALID",
    "P4_9_REPLAY_INVALID",
    "P4_8_GOVERNANCE_INVALID",
    "P4_7_EVIDENCE_GOVERNANCE_INVALID",
    "PROGRAM_1_CAPABILITY_ATLAS_INVALID",
    "PROGRAM_2_CCI_SHARED_SERVICES_INVALID",
    "PROGRAM_3_CAF_LEGION_INVALID",
    "QCI_APPLICATION_MISSING",
    "QCI_CONSTITUTION_MISSING",
    "QCI_ARCHITECTURE_MISSING",
    "INTELLIGENCE_DOMAIN_MODEL_MISSING",
    "DOMAIN_REGISTRY_INCOMPLETE",
    "COLLECTION_ENGINE_MISSING",
    "GOVERNED_SOURCE_INGESTION_MISSING",
    "SOURCE_QUALIFICATION_INVALID",
    "PROVENANCE_VALIDATION_MISSING",
    "ANALYSIS_ENGINE_MISSING",
    "TREND_ANALYSIS_MISSING",
    "COMPETITOR_COMPARISON_MISSING",
    "SWOT_GENERATION_MISSING",
    "MARKET_POSITIONING_MISSING",
    "OPPORTUNITY_THREAT_IDENTIFICATION_MISSING",
    "SYNTHESIS_ENGINE_MISSING",
    "STRATEGIC_REPORTS_MISSING",
    "CONFIDENCE_ASSESSMENTS_MISSING",
    "CAF_AGENT_INTEGRATION_MISSING",
    "CAF_GOVERNANCE_GATES_MISSING",
    "EVIDENCE_EXPLAINABILITY_MISSING",
    "EVIDENCE_CITATIONS_MISSING",
    "REASONING_LINEAGE_MISSING",
    "REPLAY_REFERENCES_MISSING",
    "INTELLIGENCE_DASHBOARD_MISSING",
    "EXECUTIVE_CONSOLE_MISSING",
    "GOVERNANCE_INTEGRATION_MISSING",
    "OPERATIONAL_READINESS_MISSING",
    "REPLAY_COMPATIBILITY_INVALID",
    "QUALIFICATION_REPORT_MISSING",
    "QUALIFICATION_EVIDENCE_MISSING",
    "QUALIFICATION_DECISION_FAILED",
    "INTELLIGENCE_WORKFLOWS_NON_DETERMINISTIC",
    "INTELLIGENCE_PRODUCTS_NOT_EXPLAINABLE",
    "IDENTITY_OWNERSHIP_ATTEMPTED",
    "NAMESPACE_OWNERSHIP_ATTEMPTED",
    "GOVERNANCE_ENFORCEMENT_ATTEMPTED",
    "REPLAY_INFRASTRUCTURE_ATTEMPTED",
    "EVIDENCE_STORAGE_ATTEMPTED",
    "TELEMETRY_INFRASTRUCTURE_ATTEMPTED",
    "CERTIFICATION_INFRASTRUCTURE_ATTEMPTED",
    "CONSTITUTIONAL_AUTHORITY_ATTEMPTED",
    "POLICY_ENFORCEMENT_ATTEMPTED",
    "DEPLOYMENT_CERTIFICATION_MISSING",
  ] as const)("fails QCI certification for %s", (scenario: QciScenario) => {
    const result = runQuantEdgeCompIntel({ scenario });
    const validation = validateQuantEdgeCompIntel(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("supports pruned certification outcomes", () => {
    const result = runQuantEdgeCompIntel({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
