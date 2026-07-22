import { describe, expect, it } from "vitest";

import {
  buildDashboardObservability,
  getDashboardObservabilityContract,
  replayDashboardObservability,
  validateDashboardObservability,
} from "../../../services/dashboard-observability";
import type {
  DashboardObservabilityFailure,
  DashboardObservabilityScenario,
} from "../../../types/dashboard-observability";

const failureScenarios: ReadonlyArray<readonly [DashboardObservabilityScenario, DashboardObservabilityFailure]> = [
  ["METRICS_COLLECTION_FAILED", "METRICS_COLLECTION_FAILED"],
  ["SOURCE_VALIDATION_FAILED", "SOURCE_STATE_VALIDATION_FAILED"],
  ["DASHBOARD_CAPTURE_FAILED", "DASHBOARD_STATE_CAPTURE_FAILED"],
  ["RENDERING_FAILED", "RENDERING_FAILURE_DETECTED"],
  ["LATENCY_DEGRADED", "LATENCY_THRESHOLD_EXCEEDED"],
  ["STALE_DASHBOARD", "DASHBOARD_STATE_STALE"],
  ["CACHE_STALE", "CACHE_STATE_STALE"],
  ["MISSING_LINEAGE", "LINEAGE_REFERENCE_MISSING"],
  ["BROKEN_LINEAGE", "LINEAGE_EDGE_BROKEN"],
  ["CROSS_TENANT_LINEAGE", "CROSS_TENANT_LINEAGE_DETECTED"],
  ["MISSING_REPLAY", "REPLAY_REFERENCE_MISSING"],
  ["REPLAY_DIVERGED", "REPLAY_OUTPUT_DIVERGED"],
  ["REPLAY_ENGINE_UNAVAILABLE", "REPLAY_ENGINE_UNAVAILABLE"],
  ["BROKEN_REFERENCE", "REFERENCE_BROKEN"],
  ["UNAUTHORIZED_REFERENCE", "REFERENCE_UNAUTHORIZED"],
  ["MISSING_APPROVAL", "APPROVAL_VISIBILITY_INCOMPLETE"],
  ["HIDDEN_REJECTION", "APPROVAL_REJECTION_HIDDEN"],
  ["EXPIRED_APPROVAL", "APPROVAL_EXPIRED_MISSHOWN"],
  ["MISSING_CERTIFICATION", "CERTIFICATION_VISIBILITY_MISSING"],
  ["CERTIFICATION_MISREPRESENTED", "CERTIFICATION_STATE_MISREPRESENTED"],
  ["CONDITIONAL_PASS_AS_PASS", "CONDITIONAL_PASS_MISREPRESENTED"],
  ["WIDGET_FAILED", "MANDATORY_WIDGET_UNHEALTHY"],
  ["NAVIGATION_BROKEN", "NAVIGATION_HEALTH_BROKEN"],
  ["SECURITY_VISIBILITY_FAILURE", "SECURITY_VISIBILITY_FAILURE"],
  ["ALERT_DELIVERY_FAILED", "ALERT_DELIVERY_FAILED"],
  ["LEDGER_WRITE_FAILED", "LEDGER_WRITE_FAILED"],
  ["OBSERVABILITY_AUTH_FAILED", "OBSERVABILITY_AUTHORIZATION_FAILED"],
  ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
  ["UNKNOWN_HEALTH", "UNKNOWN_HEALTH_STATE"],
];

describe("dashboard observability", () => {
  it("publishes the dashboard observability contract", () => {
    const contract = getDashboardObservabilityContract();

    expect(contract.doctrine.version).toBe("dashboard-observability/v10.14.11");
    expect(contract.doctrine.read_only).toBe(true);
    expect(contract.doctrine.advisory_only).toBe(true);
    expect(contract.doctrine.health_states).toEqual(expect.arrayContaining(["HEALTHY", "MISLEADING", "OBSERVABILITY_DEGRADED", "UNKNOWN"]));
    expect(contract.doctrine.health_dimensions).toEqual(expect.arrayContaining(["LINEAGE", "REPLAY", "APPROVAL_VISIBILITY", "CERTIFICATION_VISIBILITY", "SECURITY_VISIBILITY"]));
    expect(contract.doctrine.freshness_states).toContain("CACHE_STALE");
    expect(contract.doctrine.lineage_states).toContain("CROSS_TENANT_VIOLATION");
    expect(contract.doctrine.replay_states).toContain("DIVERGED");
    expect(contract.doctrine.reference_states).toContain("UNAUTHORIZED");
    expect(contract.doctrine.approval_states).toContain("MISREPRESENTED");
    expect(contract.doctrine.certification_states).toContain("MISSING");
    expect(contract.doctrine.alert_lifecycle).toContain("REMEDIATION_REQUIRED");
    expect(contract.doctrine.required_integrations).toEqual(expect.arrayContaining(["Dashboard Security and Visibility Layer", "Replay Engine", "Certification Ledger"]));
    expect(contract.validation.valid).toBe(true);
  });

  it("builds deterministically and replays without drift", () => {
    const first = buildDashboardObservability();
    const second = buildDashboardObservability();

    expect(first.status).toBe("AUTHORITATIVE");
    expect(first.validation_outcome).toBe("VALID");
    expect(first.health_evaluation.health).toBe("HEALTHY");
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateDashboardObservability(first).valid).toBe(true);
    expect(replayDashboardObservability(first)).toBe(true);
  });

  it("treats transparency health as operational health", () => {
    const result = buildDashboardObservability();

    expect(result.visibility_validator.required_blockers_visible).toBe(true);
    expect(result.visibility_validator.approvals_visible).toBe(true);
    expect(result.visibility_validator.certification_visible).toBe(true);
    expect(result.lineage_monitor.state).toBe("COMPLETE");
    expect(result.replay_monitor.state).toBe("READY");
    expect(result.reference_monitor.state).toBe("VALID_REDACTED");
    expect(result.approval_monitor.state).toBe("COMPLETE");
    expect(result.certification_monitor.state).toBe("COMPLETE");
    expect(result.health_evaluation.average_does_not_hide_critical).toBe(true);
  });

  it("keeps observability read-only and advisory", () => {
    const result = buildDashboardObservability();

    expect(result.api_surface.mutation_supported).toBe(false);
    expect(result.api_surface.source_repair_supported).toBe(false);
    expect(result.api_surface.approval_supported).toBe(false);
    expect(result.api_surface.certification_mutation_supported).toBe(false);
    expect(result.api_surface.incident_suppression_supported).toBe(false);
    expect(result.api_surface.production_adaptation_mutation_supported).toBe(false);
    expect(result.console.source_records_mutable).toBe(false);
    expect(result.usage_analytics.behavioral_ranking_present).toBe(false);
  });

  it("makes degraded observability visible", () => {
    const result = buildDashboardObservability({ scenario: "LEDGER_WRITE_FAILED" });

    expect(result.health_evaluation.health).toBe("OBSERVABILITY_DEGRADED");
    expect(result.observability_degradation_visible).toBe(true);
    expect(result.alerts[0]?.critical_auto_closed).toBe(false);
    expect(result.incidents).toHaveLength(1);
    expect(result.ledger.hash_verified).toBe(false);
  });

  it("surfaces immutable ledger, incidents, reports, and console state", () => {
    const result = buildDashboardObservability({ scenario: "MISSING_REPLAY" });

    expect(result.alerts[0]?.resolution_requires_verification).toBe(true);
    expect(result.incidents[0]?.closed_at).toBeNull();
    expect(result.ledger.append_only).toBe(true);
    expect(result.ledger.immutable).toBe(true);
    expect(result.health_report.reproducible).toBe(true);
    expect(result.console.current_incidents_visible).toBe(true);
    expect(result.console.replay_launch_supported).toBe(true);
  });

  it("surfaces validation evidence and baseline metrics", () => {
    const result = buildDashboardObservability();

    expect(result.validation_tests).toHaveLength(29);
    expect(result.metrics_service.availability_rate).toBeGreaterThan(0.99);
    expect(result.metrics_service.tenant_aware).toBe(true);
    expect(result.metrics_service.mission_aware).toBe(true);
    expect(result.metrics_service.integrity_failure_count).toBe(0);
  });

  it.each(failureScenarios)("fails visibly for %s", (scenario, failure) => {
    const result = buildDashboardObservability({ scenario });
    const validation = validateDashboardObservability(result);

    expect(result.status).toBe("REJECTED");
    expect(result.validation_outcome).toBe("INVALID");
    expect(result.failures).toContain(failure);
    expect(result.health_evaluation.health).not.toBe("HEALTHY");
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(replayDashboardObservability(result)).toBe(false);
  });

  it("detects tampering through integrity and replay checks", () => {
    const result = buildDashboardObservability();
    const tampered = {
      ...result,
      record: {
        ...result.record,
        dashboard_version: "tampered",
      },
    };

    expect(validateDashboardObservability(tampered).integrity_hash_valid).toBe(false);
    expect(replayDashboardObservability(tampered)).toBe(false);
  });
});
