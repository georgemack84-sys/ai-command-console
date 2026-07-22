import { describe, expect, it } from "vitest";
import {
  getProductionObservabilityOperatorControlBundle,
  replayProductionObservabilityOperatorControl,
  runProductionObservabilityOperatorControl,
  validateProductionObservabilityOperatorControl,
} from "@/services/production-observability-operator-control";
import type { ProductionObservabilityFailure } from "@/types/production-observability-operator-control";

describe("Mission Control Phase 15.11 Production Observability & Operator Control", () => {
  it("publishes production observability doctrine", () => {
    const bundle = getProductionObservabilityOperatorControlBundle();

    expect(bundle.doctrine.version).toBe("production-observability-operator-control/v15.11");
    expect(bundle.doctrine.upstream_phase).toBe("continuous-assurance-certification/v15.10");
    expect(bundle.doctrine.dashboard_views).toHaveLength(15);
    expect(bundle.validation.valid).toBe(true);
  });

  it("registers authorized dashboards from immutable evidence", () => {
    const result = runProductionObservabilityOperatorControl();

    expect(result.dashboard.authorized).toBe(true);
    expect(result.dashboard.views).toContain("Production Operations");
    expect(result.dashboard.evidence_refs.length).toBeGreaterThan(0);
    expect(result.dashboard.hidden_state_absent).toBe(true);
    expect(result.dashboard.immutable_projection).toBe(true);
  });

  it("makes release, tenant, advisory, replay, and certification health visible", () => {
    const result = runProductionObservabilityOperatorControl();

    expect(result.release_health.release_identity_visible).toBe(true);
    expect(result.tenant_isolation.cross_tenant_visibility_blocked).toBe(true);
    expect(result.advisory_boundary.execution_authority_absent).toBe(true);
    expect(result.replay_divergence.replay_lineage_visible).toBe(true);
    expect(result.certification_status.certification_status_visible).toBe(true);
  });

  it("preserves operator attribution, alerts, runbooks, and timeline replay", () => {
    const result = runProductionObservabilityOperatorControl();

    expect(result.operator_action.authenticated).toBe(true);
    expect(result.operator_action.attributable).toBe(true);
    expect(result.alert.constitutional_alerts_suppressible).toBe(false);
    expect(result.runbook.procedures_validated).toBe(true);
    expect(result.timeline.deterministic).toBe(true);
    expect(result.timeline.evidence_traceable).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runProductionObservabilityOperatorControl();
    const second = runProductionObservabilityOperatorControl();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProductionObservabilityOperatorControl(first).valid).toBe(true);
    expect(replayProductionObservabilityOperatorControl(first)).toBe(true);
  });

  it("executes the Phase 15.11 certification matrix", () => {
    const result = runProductionObservabilityOperatorControl();

    expect(result.certification_tests).toHaveLength(16);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Production operations visible",
      "Release health visible",
      "Tenant isolation visible",
      "Advisory boundary visible",
      "Replay divergence visible",
      "Certification health visible",
      "Operator attribution complete",
      "Alerts deterministic",
      "Runbooks validated",
      "Dashboard evidence replayable",
      "Hidden operational state absent",
      "Immutable operational lineage preserved",
      "Cross-tenant visibility blocked",
      "Advisory-only architecture preserved",
      "Dashboard projections derived from immutable evidence",
      "Constitutional alerts cannot be suppressed",
    ]);
  });

  it("supports conditional pass for non-constitutional visibility warnings", () => {
    const result = runProductionObservabilityOperatorControl({ scenario: "NON_CONSTITUTIONAL_VISIBILITY_WARNING" });
    const validation = validateProductionObservabilityOperatorControl(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "PRODUCTION_OPERATIONS_NOT_VISIBLE",
    "RELEASE_HEALTH_NOT_VISIBLE",
    "TENANT_ISOLATION_NOT_VISIBLE",
    "ADVISORY_BOUNDARY_NOT_VISIBLE",
    "REPLAY_DIVERGENCE_NOT_VISIBLE",
    "CERTIFICATION_HEALTH_NOT_VISIBLE",
    "OPERATOR_ATTRIBUTION_INCOMPLETE",
    "ALERTS_NON_DETERMINISTIC",
    "RUNBOOKS_NOT_VALIDATED",
    "DASHBOARD_EVIDENCE_NOT_REPLAYABLE",
    "HIDDEN_OPERATIONAL_STATE_PRESENT",
    "OPERATIONAL_LINEAGE_MUTABLE",
    "CROSS_TENANT_VISIBILITY_ALLOWED",
    "ADVISORY_ONLY_ARCHITECTURE_BROKEN",
    "DASHBOARD_NOT_DERIVED_FROM_IMMUTABLE_EVIDENCE",
    "CONSTITUTIONAL_ALERTS_SUPPRESSIBLE",
  ] as const)("fails certification for %s", (scenario: ProductionObservabilityFailure) => {
    const result = runProductionObservabilityOperatorControl({ scenario });
    const validation = validateProductionObservabilityOperatorControl(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested dashboard tampering", () => {
    const result = runProductionObservabilityOperatorControl();
    const tampered = {
      ...result,
      dashboard: {
        ...result.dashboard,
        hidden_state_absent: false,
      },
    };

    expect(validateProductionObservabilityOperatorControl(tampered).valid).toBe(false);
  });
});
