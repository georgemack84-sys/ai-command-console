import { describe, expect, it } from "vitest";
import {
  buildMissionControlVisibilityObservabilitySurface,
  computeMissionControlVisibilityReportHash,
  getMissionControlVisibilityContract,
  runMissionControlVisibilityContract,
  validateMissionControlVisibilityContract,
} from "@/services/mission-control-visibility-contract";
import type { MissionControlVisibilityScenario, VisibilityFailure } from "@/types/mission-control-visibility-contract";

describe("Mission Control Phase 8J.1 Visibility Contract", () => {
  it("defines visibility doctrine, dashboards, widgets, and validation outcomes", () => {
    const contract = getMissionControlVisibilityContract();

    expect(contract.doctrine.schema_version).toBe("mission-control-visibility-contract/v8J.1");
    expect(contract.doctrine.principles).toContain("advisory-only");
    expect(contract.doctrine.principles).toContain("no-execution-authority");
    expect(contract.doctrine.dashboard_types).toEqual(["EXECUTION_DASHBOARD", "AUTONOMY_DASHBOARD", "GOVERNANCE_DASHBOARD", "CONFIDENCE_DASHBOARD", "RISK_DASHBOARD", "INTERVENTION_DASHBOARD"]);
    expect(contract.doctrine.widget_types).toContain("INTEGRITY_WIDGET");
    expect(contract.doctrine.validation_outcomes).toEqual(["VALID", "CONDITIONAL", "INVALID", "BLOCKED"]);
  });

  it("builds a valid advisory-only visibility contract", () => {
    const report = runMissionControlVisibilityContract();
    const validation = validateMissionControlVisibilityContract(report);

    expect(report.phase_version).toBe("8J.1");
    expect(report.validation_outcome).toBe("VALID");
    expect(report.dashboard_contracts.length).toBe(6);
    expect(report.widget_registry.length).toBe(20);
    expect(report.visibility_schema.length).toBe(6);
    expect(report.widget_registry.every((widget) => widget.execution_authority === false)).toBe(true);
    expect(report.dashboard_contracts.every((dashboard) => dashboard.advisory_only)).toBe(true);
    expect(report.advisory_only).toBe(true);
    expect(report.execution_authority_granted).toBe(false);
    expect(validation.valid).toBe(true);
  });

  it("enforces replay, lineage, integrity, evidence, immutable ID, and timestamp requirements", () => {
    const report = runMissionControlVisibilityContract();

    expect(report.visibility_schema.every((record) => record.immutable_ids.length > 0)).toBe(true);
    expect(report.visibility_schema.every((record) => record.timestamps.length > 0)).toBe(true);
    expect(report.visibility_schema.every((record) => record.replay_references.length > 0)).toBe(true);
    expect(report.visibility_schema.every((record) => record.lineage_references.length > 0)).toBe(true);
    expect(report.visibility_schema.every((record) => record.integrity_hashes.length > 0)).toBe(true);
    expect(report.visibility_schema.every((record) => record.evidence_references.length > 0)).toBe(true);
    expect(report.visualization_standards.deterministic_ordering).toEqual(["mission_id", "execution_id", "timestamp", "lifecycle_sequence", "immutable_event_id"]);
  });

  it("repeats identical contracts with identical hashes", () => {
    const first = runMissionControlVisibilityContract();
    const second = runMissionControlVisibilityContract();

    expect(second.report_hash).toBe(first.report_hash);
    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.widget_registry.map((widget) => widget.registry_hash)).toEqual(first.widget_registry.map((widget) => widget.registry_hash));
    expect(first.report_hash).toBe(computeMissionControlVisibilityReportHash(first));
  });

  it.each([
    ["MISSING_SCHEMA", "VISIBILITY_SCHEMA_MISSING"],
    ["MISSING_DASHBOARD", "DASHBOARD_CONTRACT_MISSING"],
    ["MISSING_WIDGET_REGISTRY", "WIDGET_REGISTRY_MISSING"],
    ["MISSING_STANDARDS", "VISUALIZATION_STANDARDS_MISSING"],
    ["MISSING_IMMUTABLE_IDS", "IMMUTABLE_IDS_MISSING"],
    ["MISSING_TIMESTAMPS", "TIMESTAMPS_MISSING"],
    ["MISSING_REPLAY_REFERENCE", "REPLAY_REFERENCE_MISSING"],
    ["MISSING_LINEAGE_REFERENCE", "LINEAGE_REFERENCE_MISSING"],
    ["MISSING_INTEGRITY_HASH", "INTEGRITY_HASH_MISSING"],
    ["MISSING_EVIDENCE_REFERENCE", "EVIDENCE_REFERENCE_MISSING"],
    ["NONDETERMINISTIC_ORDERING", "DETERMINISTIC_ORDERING_MISSING"],
    ["WIDGET_MUTATION_AUTHORITY", "WIDGET_MUTATION_AUTHORITY_ALLOWED"],
    ["HIDDEN_AUTONOMOUS_STATE", "HIDDEN_AUTONOMOUS_STATE_VISIBLE"],
    ["CROSS_TENANT_VISIBILITY", "CROSS_TENANT_DATA_VISIBLE"],
    ["UNAUTHORIZED_OPERATOR", "UNAUTHORIZED_OPERATOR_VISIBLE"],
    ["STALE_DATA_MARKED_CURRENT", "STALE_DATA_NOT_DEGRADED"],
  ] as readonly [MissionControlVisibilityScenario, VisibilityFailure][])(
    "invalidates %s with %s",
    (scenario, failure) => {
      const report = runMissionControlVisibilityContract({ scenario });
      const validation = validateMissionControlVisibilityContract(report);

      expect(report.validation_outcome).toBe("INVALID");
      expect(report.failures).toContain(failure);
      expect(report.validation_tests.map((test) => test.failure_reason)).toContain(failure);
      expect(validation.valid).toBe(false);
    },
  );

  it("exposes operator observability for contract failures", () => {
    const surface = buildMissionControlVisibilityObservabilitySurface(runMissionControlVisibilityContract({ scenario: "WIDGET_MUTATION_AUTHORITY" }));

    expect(surface.validation_outcome).toBe("INVALID");
    expect(surface.failures).toContain("WIDGET_MUTATION_AUTHORITY_ALLOWED");
    expect(surface.widget_count).toBe(20);
    expect(surface.advisory_only).toBe(true);
    expect(surface.execution_authority_granted).toBe(false);
    expect(surface.failed_tests).toBeGreaterThan(0);
  });
});
