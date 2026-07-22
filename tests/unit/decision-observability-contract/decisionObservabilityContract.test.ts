import { describe, expect, it } from "vitest";
import {
  DECISION_DASHBOARD_TYPES,
  DECISION_OBSERVABILITY_LIFECYCLE_STATES,
  DECISION_VISUALIZATION_TYPES,
  VISIBILITY_ROLES,
  computeDecisionObservabilityContractHash,
  getDecisionObservabilityFoundation,
  runDecisionObservabilityContract,
  validateDecisionObservabilityContract,
} from "@/services/decision-observability-contract";
import type { DecisionObservabilityFailure, DecisionObservabilityInput } from "@/types/decision-observability-contract";

describe("Mission Control Phase 9.11.1 Decision Observability Contract", () => {
  it("publishes the decision observability foundation", () => {
    const foundation = getDecisionObservabilityFoundation();

    expect(foundation.observability_version).toBe("decision-observability-contract/v1");
    expect(foundation.lifecycle_states).toEqual(DECISION_OBSERVABILITY_LIFECYCLE_STATES);
    expect(foundation.dashboard_types).toEqual(DECISION_DASHBOARD_TYPES);
    expect(foundation.visualization_types).toEqual(DECISION_VISUALIZATION_TYPES);
    expect(foundation.roles).toEqual(VISIBILITY_ROLES);
    expect(foundation.result.validation.validation_outcome).toBe("VALID");
  });

  it("builds a complete canonical observability contract from certified replay and audit evidence", () => {
    const result = runDecisionObservabilityContract();

    expect(result.contract?.dashboard_state).toBe("ACTIVE");
    expect(result.contract?.lifecycle_state).toBe("ACTIVE");
    expect(result.contract?.governance_refs.length).toBeGreaterThan(0);
    expect(result.contract?.replay_refs.length).toBeGreaterThan(0);
    expect(result.contract?.certification_refs.length).toBeGreaterThan(0);
    expect(result.contract?.operator_action_refs.length).toBeGreaterThan(0);
    expect(result.mutates_orchestration).toBe(false);
    expect(result.advisory_only).toBe(true);
  });

  it("standardizes dashboard schemas, widget registry, visualizations, and authorization models", () => {
    const result = runDecisionObservabilityContract();

    expect(result.dashboards.map((dashboard) => dashboard.dashboard_type)).toEqual(DECISION_DASHBOARD_TYPES);
    expect(result.dashboards.every((dashboard) => dashboard.dashboard_version === "decision-dashboard-schema/v1")).toBe(true);
    expect(result.widget_registry).toHaveLength(23);
    expect(result.widget_registry.every((widget) => widget.execution_authority === false)).toBe(true);
    expect(result.visualizations).toHaveLength(5);
    expect(result.visualizations.every((visualization) => visualization.deterministic_rendering)).toBe(true);
    expect(result.authorizations.map((authorization) => authorization.role)).toEqual(VISIBILITY_ROLES);
  });

  it("requires governance, constitutional, replay, certification, tenant, and integrity visibility", () => {
    const result = runDecisionObservabilityContract();

    expect(result.validation.governance_visible).toBe(true);
    expect(result.validation.constitutional_visible).toBe(true);
    expect(result.validation.replay_consistent).toBe(true);
    expect(result.validation.certification_visible).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
    expect(result.validation.authorization_valid).toBe(true);
  });

  it("renders deterministically with reproducible hashes", () => {
    const first = runDecisionObservabilityContract();
    const second = runDecisionObservabilityContract();

    expect(second).toEqual(first);
    expect(first.contract && computeDecisionObservabilityContractHash(first.contract)).toBe(first.contract?.integrity_hash);
    expect(validateDecisionObservabilityContract(first).validation_outcome).toBe("VALID");
    expect(first.dashboards.every((dashboard) => dashboard.replay_ref === first.certification_result.replay_hash)).toBe(true);
  });

  it.each([
    ["MISSING_CONTRACT", "OBSERVABILITY_CONTRACT_INCOMPLETE"],
    ["MISSING_DASHBOARD_SCHEMA", "DASHBOARD_SCHEMA_MISSING"],
    ["MISSING_VISUALIZATION", "VISUALIZATION_CONTRACT_MISSING"],
    ["MISSING_WIDGET_REGISTRY", "WIDGET_REGISTRY_INCONSISTENT"],
    ["UNKNOWN_LIFECYCLE", "UNKNOWN_LIFECYCLE_STATE"],
    ["AUTHORIZATION_BYPASS", "AUTHORIZATION_RULE_BYPASSED"],
    ["HIDE_GOVERNANCE", "GOVERNANCE_VISIBILITY_HIDDEN"],
    ["HIDE_CONSTITUTIONAL", "CONSTITUTIONAL_STATUS_HIDDEN"],
    ["MISSING_REPLAY_REFS", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_CERTIFICATION_STATUS", "CERTIFICATION_STATUS_ABSENT"],
    ["CROSS_TENANT", "CROSS_TENANT_INFORMATION_VISIBLE"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["NONDETERMINISTIC_RENDERING", "VISUALIZATION_NOT_REPRODUCIBLE"],
    ["DASHBOARD_REPLAY_MISMATCH", "DASHBOARD_REPLAY_MISMATCH"],
    ["HIDDEN_ORCHESTRATION", "HIDDEN_ORCHESTRATION_STATE"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<DecisionObservabilityInput["scenario"]>, DecisionObservabilityFailure][])(
    "fails closed for %s",
    (scenario, failure) => {
      const result = runDecisionObservabilityContract({ scenario });
      const validation = validateDecisionObservabilityContract(result);

      expect(result.validation.validation_outcome).toBe("BLOCKED");
      expect(result.validation.failures).toContain(failure);
      expect(result.validation_tests.map((test) => test.failure_reason)).toContain(failure);
      expect(validation.validation_outcome).toBe("BLOCKED");
    },
  );

  it("detects top-level integrity tampering during validation", () => {
    const result = runDecisionObservabilityContract();
    const tampered = { ...result, integrity_hash: "tampered" };
    const validation = validateDecisionObservabilityContract(tampered);

    expect(validation.validation_outcome).toBe("BLOCKED");
    expect(validation.failures).toContain("INTEGRITY_HASH_MISMATCH");
  });
});
