import { describe, expect, it } from "vitest";
import {
  getApplicationGovernanceBindingBundle,
  replayApplicationGovernanceBinding,
  runApplicationGovernanceBinding,
  validateApplicationGovernanceBinding,
} from "@/services/application-governance-binding";
import type { ApplicationGovernanceScenario } from "@/types/application-governance-binding";

describe("Program 4 P4.8 Governance and Constitutional Binding", () => {
  it("publishes governance binding doctrine without implementing shared governance engines", () => {
    const bundle = getApplicationGovernanceBindingBundle();

    expect(bundle.doctrine.version).toBe("application-governance-binding/v4.8");
    expect(bundle.doctrine.owns_application_governance).toBe(true);
    expect(bundle.doctrine.owns_constitutional_binding).toBe(true);
    expect(bundle.doctrine.owns_authority_inheritance).toBe(true);
    expect(bundle.doctrine.owns_approval_routing).toBe(true);
    expect(bundle.doctrine.implements_governance_engines).toBe(false);
    expect(bundle.doctrine.implements_policy_engines).toBe(false);
    expect(bundle.doctrine.implements_safety_engines).toBe(false);
    expect(bundle.doctrine.performs_authority_evaluation).toBe(false);
    expect(bundle.doctrine.performs_policy_evaluation).toBe(false);
    expect(bundle.doctrine.performs_safety_evaluation).toBe(false);
    expect(bundle.doctrine.owns_runtime_governance).toBe(false);
    expect(bundle.doctrine.owns_certification).toBe(false);
    expect(bundle.doctrine.owns_evidence_storage).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("binds applications to the constitutional hierarchy and single CAF governance path", () => {
    const first = runApplicationGovernanceBinding();
    const second = runApplicationGovernanceBinding();

    expect(first.evidence_governance_ref).toBe("application-evidence-source-governance/v4.7");
    expect(first.constitutional_binding.authority_hierarchy).toEqual([
      "Civitas Constitution",
      "Program Constitutional Contracts",
      "Tenant Constitutional Contracts",
      "CAF Authority Matrix",
      "Application Governance",
    ]);
    expect(first.constitutional_binding.governance_sequence).toEqual([
      "APPLICATION_REQUEST",
      "APPLICATION_GOVERNANCE_BINDING",
      "CAF_AUTHORITY_GATE",
      "CAF_POLICY_GATE",
      "CAF_SAFETY_GATE",
      "APPROVAL_ROUTING",
      "EXECUTION_DECISION",
    ]);
    expect(first.certification.outcome).toBe("PASS");
    expect(first.certification.phase_ready).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateApplicationGovernanceBinding(first).valid).toBe(true);
    expect(replayApplicationGovernanceBinding(first)).toBe(true);
  });

  it("enforces authority ceilings, CAF gates, reproducible lineage, evidence, and compliance reports", () => {
    const result = runApplicationGovernanceBinding();

    expect(result.authority_binding.authority_expansion_impossible).toBe(true);
    expect(result.approval_routing.caf_authority_gate_ref).toBe("Program 3 - CAF Authority Gate");
    expect(result.policy_compliance.caf_policy_gate_ref).toBe("Program 3 - CAF Policy Gate");
    expect(result.safety_compliance.caf_safety_gate_ref).toBe("Program 3 - CAF Safety Gate");
    expect(result.approval_routing.deterministic).toBe(true);
    expect(result.governance_evidence.complete).toBe(true);
    expect(result.governance_evidence.governance_lineage_refs.length).toBeGreaterThan(0);
    expect(result.compliance_report.generated).toBe(true);
    expect(result.certification.no_governance_bypass).toBe(true);
    expect(result.certification.no_authority_elevation).toBe(true);
    expect(result.certification.no_out_of_scope_ownership).toBe(true);
  });

  it.each([
    "P4_7_EVIDENCE_GOVERNANCE_INVALID",
    "CCI_GOVERNANCE_SERVICES_INVALID",
    "CCI_GOVERNANCE_REGISTRY_INVALID",
    "CCI_EVIDENCE_SERVICES_INVALID",
    "CCI_IDENTITY_SERVICES_INVALID",
    "CCI_AUDIT_SERVICES_INVALID",
    "CAF_AUTHORITY_GATE_INVALID",
    "CAF_POLICY_GATE_INVALID",
    "CAF_SAFETY_GATE_INVALID",
    "CAF_AUTHORITY_MATRIX_INVALID",
    "CAF_WARNING_FRAMEWORK_INVALID",
    "CAF_GOVERNANCE_EVIDENCE_INVALID",
    "PROGRAM_1_CONSTITUTIONAL_BASELINE_INVALID",
    "CONSTITUTIONAL_BINDING_MISSING",
    "GOVERNANCE_INHERITANCE_NON_DETERMINISTIC",
    "AUTHORITY_INHERITANCE_INVALID",
    "AUTHORITY_EXPANSION_ALLOWED",
    "INDEPENDENT_GOVERNANCE_MODEL_DEFINED",
    "GOVERNANCE_ENGINE_DUPLICATED",
    "POLICY_ENGINE_DUPLICATED",
    "SAFETY_ENGINE_DUPLICATED",
    "AUTHORITY_EVALUATION_DUPLICATED",
    "POLICY_EVALUATION_DUPLICATED",
    "SAFETY_EVALUATION_DUPLICATED",
    "EXECUTION_ADMISSION_ATTEMPTED",
    "RUNTIME_GOVERNANCE_ATTEMPTED",
    "CERTIFICATION_ATTEMPTED",
    "EVIDENCE_STORAGE_ATTEMPTED",
    "AUDIT_INFRASTRUCTURE_ATTEMPTED",
    "GOVERNANCE_NOT_ATTACHED",
    "GOVERNANCE_CONTRACT_INVALID",
    "APPROVAL_ROUTING_NON_DETERMINISTIC",
    "APPROVAL_LINEAGE_INCOMPLETE",
    "CAF_AUTHORITY_GATE_NOT_BOUND",
    "CAF_POLICY_GATE_NOT_BOUND",
    "CAF_SAFETY_GATE_NOT_BOUND",
    "POLICY_INHERITANCE_INVALID",
    "SAFETY_LINEAGE_INCOMPLETE",
    "GOVERNANCE_EVIDENCE_MISSING",
    "GOVERNANCE_LINEAGE_INCOMPLETE",
    "COMPLIANCE_REPORT_MISSING",
    "COMPLIANCE_RECORD_MISSING",
    "CONSTITUTIONAL_GOVERNANCE_BYPASS_ALLOWED",
  ] as const)("fails governance binding certification for %s", (scenario: ApplicationGovernanceScenario) => {
    const result = runApplicationGovernanceBinding({ scenario });
    const validation = validateApplicationGovernanceBinding(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("supports pruned certification outcomes", () => {
    const result = runApplicationGovernanceBinding({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
