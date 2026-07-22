import { describe, expect, it } from "vitest";
import { getEcosystemPortfolioGovernanceBundle, replayEcosystemPortfolioGovernance, runEcosystemPortfolioGovernance, validateEcosystemPortfolioGovernance } from "@/services/ecosystem-portfolio-governance";
import type { EcosystemPortfolioGovernanceScenario } from "@/types/ecosystem-portfolio-governance";

describe("Program 4 P4.20 Ecosystem Portfolio Governance", () => {
  it("publishes portfolio doctrine as aggregation and reporting only", () => {
    const bundle = getEcosystemPortfolioGovernanceBundle();

    expect(bundle.doctrine.version).toBe("ecosystem-portfolio-governance/v4.20");
    expect(bundle.doctrine.owns_application_portfolio_governance).toBe(true);
    expect(bundle.doctrine.owns_portfolio_monitoring).toBe(true);
    expect(bundle.doctrine.owns_governance_aggregation).toBe(true);
    expect(bundle.doctrine.owns_certification_aggregation).toBe(true);
    expect(bundle.doctrine.certifies_applications).toBe(false);
    expect(bundle.doctrine.qualifies_applications).toBe(false);
    expect(bundle.doctrine.approves_applications).toBe(false);
    expect(bundle.doctrine.revokes_applications).toBe(false);
    expect(bundle.doctrine.modifies_application_governance).toBe(false);
    expect(bundle.doctrine.overrides_application_authority).toBe(false);
    expect(bundle.doctrine.executes_operational_workflows).toBe(false);
    expect(bundle.doctrine.issues_constitutional_decisions).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("aggregates deterministic portfolio inventory, health, reports, and evidence lineage", () => {
    const first = runEcosystemPortfolioGovernance();
    const second = runEcosystemPortfolioGovernance();

    expect(first.phase_identifier).toBe("EcosystemPortfolioGovernance");
    expect(first.interoperability_ref).toBe("cross-application-interoperability/v4.19");
    expect(first.inventory.application_refs).toContain("app:mission-control");
    expect(first.inventory.application_refs).toContain("app:stevn-application");
    expect(first.inventory.application_refs).toContain("federation:program-4:applications");
    expect(first.inventory.application_refs).toHaveLength(9);
    expect(first.health.application_count).toBe(9);
    expect(first.health.health_score).toBe(100);
    expect(first.reports.reproducible).toBe(true);
    expect(first.evidence.lineage_intact).toBe(true);
    expect(first.evidence.modifies_evidence).toBe(false);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateEcosystemPortfolioGovernance(first).valid).toBe(true);
    expect(replayEcosystemPortfolioGovernance(first)).toBe(true);
  });

  it("aggregates certification, governance, interoperability, operational, dashboard, analytics, and executive views", () => {
    const result = runEcosystemPortfolioGovernance();

    expect(result.certification_aggregation.certificate_refs).toHaveLength(9);
    expect(result.certification_aggregation.certification_status_refs).toContain("status:certified:applications");
    expect(result.governance_aggregation.governance_compliance_refs).toContain("evidence:governance:portfolio");
    expect(result.interoperability_monitoring.interoperability_evidence_refs).toContain("evidence:interoperability:portfolio");
    expect(result.operational_monitoring.operational_evidence_refs).toContain("evidence:operations:portfolio");
    expect(result.dashboard.view_refs).toContain("view:ecosystem-health");
    expect(result.analytics.maturity_progression_ref).toBe("maturity:portfolio");
    expect(result.executive.strategic_dashboard_ref).toBe("executive:strategic-dashboard");
    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.no_constitutional_decisions).toBe(true);
  });

  it.each([
    "P4_19_INTEROPERABILITY_INVALID",
    "P4_10_OPERATIONAL_EVIDENCE_INVALID",
    "P4_8_GOVERNANCE_EVIDENCE_INVALID",
    "P4_6_INTEROPERABILITY_EVIDENCE_INVALID",
    "P4_5_CERTIFICATION_EVIDENCE_INVALID",
    "PORTFOLIO_FOUNDATION_MISSING",
    "PORTFOLIO_REGISTRY_MISSING",
    "PORTFOLIO_INVENTORY_MISSING",
    "APPLICATION_INVENTORY_INCOMPLETE",
    "CERTIFICATION_AGGREGATION_MISSING",
    "CERTIFICATION_STATUS_REFS_MISSING",
    "GOVERNANCE_AGGREGATION_MISSING",
    "GOVERNANCE_EVIDENCE_MISSING",
    "INTEROPERABILITY_MONITORING_MISSING",
    "INTEROPERABILITY_EVIDENCE_MISSING",
    "OPERATIONAL_MONITORING_MISSING",
    "OPERATIONAL_EVIDENCE_MISSING",
    "PORTFOLIO_DASHBOARD_MISSING",
    "DASHBOARD_STATUS_INACCURATE",
    "GOVERNANCE_REPORTING_MISSING",
    "REPORT_NON_REPRODUCIBLE",
    "PORTFOLIO_ANALYTICS_MISSING",
    "ANALYTICS_NONDETERMINISTIC",
    "PORTFOLIO_HEALTH_ASSESSMENT_MISSING",
    "HEALTH_SUMMARY_INCOMPLETE",
    "EVIDENCE_AGGREGATION_MISSING",
    "EVIDENCE_LINEAGE_BROKEN",
    "EXECUTIVE_REPORTING_MISSING",
    "TENANT_ISOLATION_INVALID",
    "APPLICATION_OWNERSHIP_NOT_PRESERVED",
    "EVIDENCE_MODIFICATION_ATTEMPTED",
    "CERTIFICATION_DECISION_ATTEMPTED",
    "QUALIFICATION_DECISION_ATTEMPTED",
    "APPROVAL_DECISION_ATTEMPTED",
    "SUSPENSION_DECISION_ATTEMPTED",
    "REVOCATION_DECISION_ATTEMPTED",
    "GOVERNANCE_MODIFICATION_ATTEMPTED",
    "AUTHORITY_OVERRIDE_ATTEMPTED",
    "OPERATIONAL_WORKFLOW_EXECUTION_ATTEMPTED",
    "CONSTITUTIONAL_DECISION_ATTEMPTED",
  ] as const)("fails portfolio governance validation for %s", (scenario: EcosystemPortfolioGovernanceScenario) => {
    const result = runEcosystemPortfolioGovernance({ scenario });
    const validation = validateEcosystemPortfolioGovernance(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("supports pruned certification outcomes", () => {
    const result = runEcosystemPortfolioGovernance({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
