import { describe, expect, it } from "vitest";
import {
  getPilotExpansionGovernanceBundle,
  replayPilotExpansionGovernance,
  runPilotExpansionGovernance,
  validatePilotExpansionGovernance,
} from "@/services/pilot-expansion-governance";
import type { PilotExpansionGovernanceFailure } from "@/types/pilot-expansion-governance";

describe("Mission Control Phase 16.10 Pilot Expansion Governance", () => {
  it("publishes pilot expansion governance doctrine", () => {
    const bundle = getPilotExpansionGovernanceBundle();

    expect(bundle.doctrine.version).toBe("pilot-expansion-governance/v16.10");
    expect(bundle.doctrine.upstream_phase).toBe("pilot-readiness-assessment/v16.9");
    expect(bundle.doctrine.expansion_types).toEqual(["TENANT", "ENVIRONMENT", "WORKLOAD", "CAPABILITY", "GEOGRAPHIC"]);
    expect(bundle.doctrine.vp2_options).toContain("CANONICAL_EVIDENCE_SUBSYSTEM");
    expect(bundle.validation.valid).toBe(true);
  });

  it("governs every expansion scope category through policy", () => {
    const result = runPilotExpansionGovernance();

    expect(result.policy.governed_types).toHaveLength(5);
    expect(result.policy.certification_required).toBe(true);
    expect(result.policy.advisory_only_required).toBe(true);
    expect(result.policy.prevents_unauthorized_growth).toBe(true);
  });

  it("qualifies expansion from Phase 16.9 readiness inputs", () => {
    const result = runPilotExpansionGovernance();

    expect(result.qualification.outcome).toBe("QUALIFIED");
    expect(result.qualification.pilot_certification_status).toBe("PASSING");
    expect(result.qualification.inputs).toHaveLength(10);
    expect(result.qualification.deterministic).toBe(true);
    expect(result.qualification.evidence_refs.length).toBeGreaterThan(0);
  });

  it("evaluates deterministic expansion risk", () => {
    const result = runPilotExpansionGovernance();

    expect(result.risk_assessment.categories).toHaveLength(9);
    expect(result.risk_assessment.risk_level).toBe("LOW");
    expect(result.risk_assessment.response).toBe("ACCEPT");
    expect(result.risk_assessment.evaluated).toBe(true);
  });

  it("records attributable advisory-only approval workflow", () => {
    const result = runPilotExpansionGovernance();

    expect(result.approval_workflow.decision).toBe("APPROVE");
    expect(result.approval_workflow.attributable).toBe(true);
    expect(result.approval_workflow.grants_operational_authority).toBe(false);
    expect(result.approval_workflow.advisory_only).toBe(true);
  });

  it("creates immutable expansion record and registry", () => {
    const result = runPilotExpansionGovernance({ expansion_type: "GEOGRAPHIC", requested_scope: ["us-east-1", "us-west-2"] });

    expect(result.expansion_record.expansion_type).toBe("GEOGRAPHIC");
    expect(result.expansion_record.requested_scope).toEqual(["us-east-1", "us-west-2"]);
    expect(result.expansion_record.approved_scope).toEqual(["us-east-1", "us-west-2"]);
    expect(result.expansion_record.expansion_status).toBe("ACTIVATED");
    expect(result.registry.approved_count).toBe(1);
    expect(result.registry.immutable).toBe(true);
  });

  it("maintains complete expansion lineage graph", () => {
    const result = runPilotExpansionGovernance();

    expect(result.lineage_graph).toHaveLength(9);
    expect(result.lineage_graph.map((entry) => entry.node_type)).toEqual(["PILOT", "CERTIFICATION", "QUALIFICATION", "APPROVAL", "EVIDENCE", "REPLAY", "MONITORING", "INCIDENT", "EXPANSION_HISTORY"]);
    expect(result.lineage_graph.every((entry) => entry.refs.length > 0)).toBe(true);
  });

  it("completes VP2 using the canonical evidence platform", () => {
    const result = runPilotExpansionGovernance();

    expect(result.evidence_integration.vp2_outcome).toBe("PASS");
    expect(result.evidence_integration.duplicate_evidence_infrastructure_created).toBe(false);
    expect(result.evidence_integration.persistence_reused).toBe(true);
    expect(result.evidence_integration.lineage_graph_reused).toBe(true);
    expect(result.evidence_integration.integrity_validation_reused).toBe(true);
  });

  it("publishes governance dashboard and immutable decision ledger", () => {
    const result = runPilotExpansionGovernance();

    expect(result.dashboard.outcome).toBe("APPROVE");
    expect(result.dashboard.unauthorized_growth_alerts).toBe(0);
    expect(result.decision_ledger).toHaveLength(9);
    expect(result.decision_ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable && entry.governance_refs.length > 0)).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runPilotExpansionGovernance();
    const second = runPilotExpansionGovernance();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validatePilotExpansionGovernance(first).valid).toBe(true);
    expect(replayPilotExpansionGovernance(first)).toBe(true);
  });

  it("executes the Phase 16.10 expansion certification matrix", () => {
    const result = runPilotExpansionGovernance();

    expect(result.certification_tests).toHaveLength(12);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Expansion governed",
      "Qualification deterministic",
      "Risk evaluated",
      "Advisory-only boundary preserved",
      "Certification prerequisite enforced",
      "Expansion lineage complete",
      "Expansion evidence immutable",
      "Replay reproducible",
      "Governance approvals attributable",
      "VP2 complete",
      "Unauthorized pilot growth prevented",
      "Phase 16.9 readiness valid",
    ]);
  });

  it("supports conditional pass for non-constitutional expansion warnings", () => {
    const result = runPilotExpansionGovernance({ scenario: "NON_CONSTITUTIONAL_EXPANSION_WARNING" });
    const validation = validatePilotExpansionGovernance(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "EXPANSION_NOT_GOVERNED",
    "QUALIFICATION_NOT_DETERMINISTIC",
    "RISK_NOT_EVALUATED",
    "ADVISORY_BOUNDARY_WEAKENED",
    "CERTIFICATION_PREREQUISITE_NOT_ENFORCED",
    "EXPANSION_LINEAGE_INCOMPLETE",
    "EXPANSION_EVIDENCE_MUTABLE",
    "EXPANSION_REPLAY_NOT_REPRODUCIBLE",
    "GOVERNANCE_APPROVALS_NOT_ATTRIBUTABLE",
    "VP2_NOT_COMPLETE",
    "UNAUTHORIZED_PILOT_GROWTH",
    "PHASE_16_9_READINESS_NOT_VALID",
  ] as const)("fails certification for %s", (scenario: PilotExpansionGovernanceFailure) => {
    const result = runPilotExpansionGovernance({ scenario });
    const validation = validatePilotExpansionGovernance(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested expansion record tampering", () => {
    const result = runPilotExpansionGovernance();
    const tampered = {
      ...result,
      expansion_record: {
        ...result.expansion_record,
        expansion_status: "BLOCKED" as const,
      },
    };

    expect(validatePilotExpansionGovernance(tampered).valid).toBe(false);
  });
});
