import { describe, expect, it } from "vitest";
import {
  establishAdaptiveSimulationContract,
  getAdaptiveSimulationContractFoundation,
  replayAdaptiveSimulationContract,
} from "@/services/adaptive-simulation-contract";
import type {
  AdaptiveSimulationContractFailure,
  AdaptiveSimulationContractScenario,
  AdaptiveSimulationLifecycleState,
  AdaptiveSimulationScope,
} from "@/types/adaptive-simulation-contract";

describe("Mission Control Phase 10.11.1 Adaptive Simulation Contract", () => {
  const expectedStates: readonly AdaptiveSimulationLifecycleState[] = [
    "PROPOSAL_RECEIVED",
    "VALIDATION_READY",
    "SIMULATION_PREPARATION",
    "SIMULATION_RUNNING",
    "RESULT_ANALYSIS",
    "REPLAY_VALIDATION",
    "DIVERGENCE_ANALYSIS",
    "CERTIFICATION_RECOMMENDATION",
    "COMPLETE",
  ];

  const expectedScopes: readonly AdaptiveSimulationScope[] = [
    "HISTORICAL_REPLAY",
    "COUNTERFACTUAL_REPLAY",
    "ADAPTATION_VALIDATION",
    "PROPOSAL_COMPARISON",
    "GOVERNANCE_VALIDATION",
    "RISK_SIMULATION",
    "CONFIDENCE_SIMULATION",
    "MISSION_SIMULATION",
    "ROLLBACK_SIMULATION",
    "ADVERSARIAL_SIMULATION",
  ];

  it("publishes the authoritative adaptive simulation contract", () => {
    const foundation = getAdaptiveSimulationContractFoundation();

    expect(foundation.adaptive_simulation_contract_version).toBe("adaptive-simulation-contract/v1");
    expect(foundation.lifecycle_states).toEqual(expectedStates);
    expect(foundation.supported_scopes).toEqual(expectedScopes);
    expect(foundation.api_surface.establish_contract).toBe("POST /adaptive-simulation-contract/establish");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /adaptive-simulation-contract/contract");
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.api_surface.historical_evidence_mutation_supported).toBe(false);
    expect(foundation.api_surface.governance_override_supported).toBe(false);
    expect(foundation.api_surface.authority_expansion_supported).toBe(false);
    expect(foundation.api_surface.autonomous_decision_supported).toBe(false);
    expect(foundation.api_surface.advisory_only).toBe(true);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.result.contract_identifier).toBe("AdaptiveSimulationContract");
    expect(foundation.result.contract_semver).toBe("1.0");
    expect(foundation.result.contract_status).toBe("AUTHORITATIVE");
  });

  it("establishes deterministically with stable replay and integrity hashes", () => {
    const first = establishAdaptiveSimulationContract();
    const second = establishAdaptiveSimulationContract();

    expect(first.lifecycle.map((state) => state.integrity_hash)).toEqual(second.lifecycle.map((state) => state.integrity_hash));
    expect(first.boundaries.map((boundary) => boundary.integrity_hash)).toEqual(second.boundaries.map((boundary) => boundary.integrity_hash));
    expect(first.input_contract.integrity_hash).toBe(second.input_contract.integrity_hash);
    expect(first.output_contract.integrity_hash).toBe(second.output_contract.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayAdaptiveSimulationContract(first)).toBe(true);
  });

  it("defines the complete linear lifecycle with deterministic requirements", () => {
    const lifecycle = establishAdaptiveSimulationContract().lifecycle;

    expect(lifecycle.map((state) => state.state)).toEqual(expectedStates);
    expect(lifecycle[0].requirements).toContain("proposal_certified_valid");
    expect(lifecycle[2].requirements).toContain("deterministic_seed_prepared");
    expect(lifecycle[3].requirements).toContain("isolated_execution");
    expect(lifecycle[5].requirements).toContain("identical_event_ordering_verified");
    expect(lifecycle[6].requirements).toContain("unexplained_divergence_rejected");
    expect(lifecycle[7].requirements).toContain("governance_review_supported");
    expect(lifecycle[8].requirements).toContain("immutable_audit_recorded");
    expect(lifecycle[0].allowed_next_states).toEqual(["VALIDATION_READY"]);
    expect(lifecycle.at(-1)?.allowed_next_states).toEqual([]);
  });

  it("declares every required simulation scope", () => {
    const result = establishAdaptiveSimulationContract();

    expect(result.supported_scopes).toEqual(expectedScopes);
    expect(result.metrics.simulation_scopes_defined).toBe(10);
  });

  it("forbids approval, deployment, production, history, governance, authority, and tenant mutation", () => {
    const names = establishAdaptiveSimulationContract().boundaries.map((boundary) => boundary.name);

    expect(names).toContain("approve_reject_or_deploy_proposals");
    expect(names).toContain("modify_production_recommendations");
    expect(names).toContain("update_production_models");
    expect(names).toContain("change_historical_records");
    expect(names).toContain("change_governance_policy");
    expect(names).toContain("change_constitutional_policy");
    expect(names).toContain("change_tenant_state");
    expect(names).toContain("autonomous_decision");
    expect(names).toContain("authority_expansion");
    expect(establishAdaptiveSimulationContract().boundaries.every((boundary) => boundary.prohibited)).toBe(true);
  });

  it("requires canonical inputs from proposal, historical evidence, replay, governance, tenant, and simulation configuration", () => {
    const input = establishAdaptiveSimulationContract().input_contract;

    expect(input.required_inputs).toContain("proposal_identifier");
    expect(input.required_inputs).toContain("proposal_version");
    expect(input.required_inputs).toContain("proposal_hash");
    expect(input.required_inputs).toContain("historical_evidence");
    expect(input.required_inputs).toContain("operator_history");
    expect(input.required_inputs).toContain("replay_timeline");
    expect(input.required_inputs).toContain("decision_graph");
    expect(input.required_inputs).toContain("recommendation_graph");
    expect(input.required_inputs).toContain("governance_graph");
    expect(input.required_inputs).toContain("constitutional_rules");
    expect(input.required_inputs).toContain("authority_rules");
    expect(input.required_inputs).toContain("approval_requirements");
    expect(input.required_inputs).toContain("tenant_isolation_metadata");
    expect(input.required_inputs).toContain("deterministic_seed");
    expect(input.proposal_certification_required).toBe(true);
    expect(input.replay_timeline_required).toBe(true);
    expect(input.governance_graph_required).toBe(true);
  });

  it("requires immutable replay, divergence, impact, rollback, certification, and audit outputs", () => {
    const output = establishAdaptiveSimulationContract().output_contract;

    expect(output.required_outputs).toEqual([
      "simulation_record",
      "replay_package",
      "evidence_bundle",
      "divergence_report",
      "impact_analysis",
      "governance_assessment",
      "operator_assessment",
      "rollback_assessment",
      "certification_recommendation",
      "audit_package",
    ]);
    expect(output.immutable_evidence_required).toBe(true);
    expect(output.replay_bundle_required).toBe(true);
    expect(output.explainability_required).toBe(true);
    expect(output.audit_package_required).toBe(true);
    expect(output.production_mutation_supported).toBe(false);
    expect(output.autonomous_decision_supported).toBe(false);
  });

  it("preserves advisory-only execution and never mutates production or evidence state", () => {
    const result = establishAdaptiveSimulationContract();

    expect(result.advisory_only).toBe(true);
    expect(result.modifies_production_behavior).toBe(false);
    expect(result.modifies_historical_evidence).toBe(false);
    expect(result.updates_production_models).toBe(false);
    expect(result.updates_confidence).toBe(false);
    expect(result.modifies_risk_calculations).toBe(false);
    expect(result.changes_tenant_state).toBe(false);
    expect(result.authorizes_implementation).toBe(false);
  });

  it("publishes complete baseline observability metrics", () => {
    const metrics = establishAdaptiveSimulationContract().metrics;

    expect(metrics.lifecycle_states_defined).toBe(9);
    expect(metrics.simulation_scopes_defined).toBe(10);
    expect(metrics.prohibited_boundaries_defined).toBe(11);
    expect(metrics.determinism_guaranteed).toBe(true);
    expect(metrics.replayability_guaranteed).toBe(true);
    expect(metrics.governance_preserved).toBe(true);
    expect(metrics.constitutional_governance_preserved).toBe(true);
    expect(metrics.authority_preserved).toBe(true);
    expect(metrics.tenant_isolation_preserved).toBe(true);
    expect(metrics.advisory_only_preserved).toBe(true);
    expect(metrics.explainability_guaranteed).toBe(true);
    expect(metrics.audit_complete).toBe(true);
    expect(metrics.evidence_complete).toBe(true);
    expect(metrics.integrity_verified).toBe(true);
    expect(metrics.rollback_validated).toBe(true);
    expect(metrics.validation_failures).toEqual([]);
  });

  it.each([
    ["CERTIFICATION_UNAVAILABLE", "PROPOSAL_CERTIFICATION_UNAVAILABLE"],
    ["CERTIFICATION_FAIL", "PROPOSAL_NOT_CERTIFIED"],
    ["CERTIFICATION_CONDITIONAL", "PROPOSAL_NOT_CERTIFIED"],
    ["NONDETERMINISTIC", "DETERMINISM_REQUIREMENT_UNSATISFIED"],
    ["REPLAY_UNAVAILABLE", "REPLAY_REQUIREMENT_UNSATISFIED"],
    ["GOVERNANCE_UNSATISFIED", "GOVERNANCE_REQUIREMENT_UNSATISFIED"],
    ["CONSTITUTIONAL_UNSATISFIED", "CONSTITUTIONAL_REQUIREMENT_UNSATISFIED"],
    ["AUTHORITY_UNSATISFIED", "AUTHORITY_REQUIREMENT_UNSATISFIED"],
    ["OPERATOR_AUTHORITY_UNSATISFIED", "OPERATOR_AUTHORITY_REQUIREMENT_UNSATISFIED"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_UNSATISFIED"],
    ["ROLLBACK_UNSATISFIED", "ROLLBACK_VALIDATION_UNSATISFIED"],
    ["EVIDENCE_IMMUTABILITY_FAILURE", "IMMUTABLE_EVIDENCE_REQUIREMENT_UNSATISFIED"],
    ["UNEXPLAINED_DIVERGENCE", "EXPLAINABILITY_REQUIREMENT_UNSATISFIED"],
    ["INCOMPLETE_AUDIT_TRAIL", "AUDIT_TRAIL_INCOMPLETE"],
    ["MISSING_EVIDENCE", "EVIDENCE_REQUIREMENT_UNSATISFIED"],
    ["INTEGRITY_VERIFICATION_FAILURE", "INTEGRITY_VERIFICATION_UNSATISFIED"],
    ["SIMULATION_STATE_CORRUPTION", "SIMULATION_STATE_CORRUPTION_DETECTED"],
    ["PRODUCTION_MUTATION", "PRODUCTION_MUTATION_ATTEMPT"],
    ["HISTORICAL_EVIDENCE_MUTATION", "HISTORICAL_EVIDENCE_MUTATION_ATTEMPT"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_ATTEMPT"],
    ["AUTHORITY_EXPANSION", "AUTHORITY_EXPANSION_ATTEMPT"],
    ["AUTONOMOUS_DECISION", "AUTONOMOUS_DECISION_ATTEMPT"],
    ["RISK_CONFIDENCE_MUTATION", "RISK_CONFIDENCE_MUTATION_ATTEMPT"],
    ["TENANT_STATE_MUTATION", "TENANT_STATE_MUTATION_ATTEMPT"],
  ] as const)("fails closed for %s", (scenario: AdaptiveSimulationContractScenario, failure: AdaptiveSimulationContractFailure) => {
    const result = establishAdaptiveSimulationContract({ scenario });

    expect(result.contract_status).toBe("FAIL_CLOSED");
    expect(result.failures).toContain(failure);
    expect(result.replayable).toBe(false);
    expect(replayAdaptiveSimulationContract(result)).toBe(true);
  });

  it("detects replay tampering", () => {
    const result = establishAdaptiveSimulationContract();
    const tampered = {
      ...result,
      metrics: {
        ...result.metrics,
        lifecycle_states_defined: 8,
      },
    };

    expect(replayAdaptiveSimulationContract(tampered)).toBe(false);
  });
});
