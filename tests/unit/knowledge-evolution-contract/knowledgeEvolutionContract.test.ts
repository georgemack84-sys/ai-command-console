import { describe, expect, it } from "vitest";
import {
  buildKnowledgeEvolutionObservabilitySurface,
  getKnowledgeActivationContract,
  getKnowledgeArtifactSchema,
  getKnowledgeEvolutionContract,
  getKnowledgeEvolutionContractBundle,
  getKnowledgeGovernanceRules,
  getKnowledgeLifecycleModel,
  validateKnowledgeEvolutionContract,
} from "@/services/knowledge-evolution-contract";
import type { KnowledgeEvolutionFailure, KnowledgeEvolutionScenario } from "@/types/knowledge-evolution-contract";

describe("knowledge evolution contract", () => {
  it("publishes the deterministic contract bundle", () => {
    const bundle = getKnowledgeEvolutionContractBundle();

    expect(bundle.doctrine.contract_version).toBe("knowledge-evolution-contract/v8ALT.9.1");
    expect(bundle.doctrine.final_state).toBe("KNOWLEDGE_EVOLUTION_CONTRACT_DEFINED");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.contract.advisory_only).toBe(true);
    expect(bundle.contract.learning_execution_authorized).toBe(false);
    expect(bundle.contract.activation_authority).toBe(false);
    expect(bundle.contract.operator_approval_required).toBe(true);
    expect(bundle.contract.self_modification_allowed).toBe(false);
  });

  it("defines artifact schema, lifecycle, governance, and activation surfaces", () => {
    expect(getKnowledgeArtifactSchema().identity.knowledge_id).toBeTruthy();
    expect(getKnowledgeLifecycleModel()).toEqual(["CAPTURED", "NORMALIZED", "ANALYZED", "VALIDATED", "CERTIFIED", "APPROVED", "ACTIVE", "SUPERSEDED", "ARCHIVED", "REJECTED"]);
    expect(getKnowledgeGovernanceRules().operator_approval_required).toBe(true);
    expect(getKnowledgeActivationContract().activation_authority).toBe(false);
  });

  it("separates approval contract from activation authority", () => {
    const contract = getKnowledgeEvolutionContract();

    expect(contract.activation_contract.approval_required).toBe(true);
    expect(contract.activation_contract.activation_state).toBe("NOT_APPROVED");
    expect(contract.activation_contract.activation_authority).toBe(false);
    expect(contract.activation_contract.learning_execution_authorized).toBe(false);
  });

  it.each([
    ["GOVERNANCE_BYPASS_ATTEMPTED", "GOVERNANCE_BYPASS_DETECTED"],
    ["CONSTITUTIONAL_MODIFICATION_ATTEMPTED", "CONSTITUTIONAL_MODIFICATION_DETECTED"],
    ["AUTHORITY_ESCALATION_ATTEMPTED", "AUTHORITY_ESCALATION_DETECTED"],
    ["REPLAY_MUTATION_ATTEMPTED", "REPLAY_MUTATION_DETECTED"],
    ["MISSION_HISTORY_REWRITE_ATTEMPTED", "MISSION_HISTORY_REWRITE_DETECTED"],
    ["AUDIT_RECORD_DELETION_ATTEMPTED", "AUDIT_RECORD_DELETION_DETECTED"],
    ["CROSS_TENANT_CONTAMINATION_ATTEMPTED", "CROSS_TENANT_CONTAMINATION_DETECTED"],
    ["ACTIVATION_WITHOUT_OPERATOR_APPROVAL", "OPERATOR_APPROVAL_MISSING"],
    ["MUTABLE_VERSION_ATTEMPTED", "MUTABLE_VERSION_DETECTED"],
    ["MISSING_EVIDENCE_LINEAGE", "EVIDENCE_LINEAGE_MISSING"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["HIDDEN_LEARNING_ARTIFACT", "HIDDEN_LEARNING_ARTIFACT_DETECTED"],
  ] satisfies [KnowledgeEvolutionScenario, KnowledgeEvolutionFailure][])("fails closed for %s", (scenario, failure) => {
    const contract = getKnowledgeEvolutionContract({ scenario });
    const validation = validateKnowledgeEvolutionContract(contract);

    expect(contract.final_state).toBe("KNOWLEDGE_EVOLUTION_CONTRACT_BLOCKED");
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
    expect(contract.learning_execution_authorized).toBe(false);
    expect(contract.activation_authority).toBe(false);
  });

  it("publishes observability without learning or activation authority", () => {
    const surface = buildKnowledgeEvolutionObservabilitySurface();

    expect(surface.final_state).toBe("KNOWLEDGE_EVOLUTION_CONTRACT_DEFINED");
    expect(surface.lifecycle_state_count).toBe(10);
    expect(surface.failure_count).toBe(0);
    expect(surface.learning_execution_authorized).toBe(false);
    expect(surface.activation_authority).toBe(false);
    expect(surface.integrity_hash).toBeTruthy();
  });
});
