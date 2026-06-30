import { describe, expect, it } from "vitest";
import {
  buildRuntimeAssuranceDashboardSurface,
  buildRuntimeAssurancePackage,
  computeRuntimeAssuranceEvidenceHash,
  getRuntimeAssuranceFramework,
} from "@/services/runtime-assurance-engine";
import type { RuntimeAssuranceFailureReason, RuntimeAssuranceScenario } from "@/types/runtime-assurance-engine";

describe("Mission Control Phase 8E.2 Runtime Assurance Engine", () => {
  it("publishes deterministic doctrine, pipeline states, and health levels", () => {
    const framework = getRuntimeAssuranceFramework();

    expect(framework.doctrine.engine_version).toBe("runtime-assurance-engine/v8E.2");
    expect(framework.doctrine.principles).toContain("advisory-only");
    expect(framework.doctrine.principles).toContain("fail-closed");
    expect(framework.doctrine.states).toContain("COLLECTING_RUNTIME_DATA");
    expect(framework.doctrine.states).toContain("ACTIVE");
    expect(framework.doctrine.health_levels).toEqual(["EXCELLENT", "HEALTHY", "STABLE", "WATCH", "DEGRADED", "HIGH_RISK", "CRITICAL"]);
    expect(framework.package.validation.validation_state).toBe("PASS");
  });

  it("builds a baseline runtime assurance package without modifying execution authority", () => {
    const pkg = buildRuntimeAssurancePackage();

    expect(Object.isFrozen(pkg)).toBe(true);
    expect(pkg.engine_version).toBe("runtime-assurance-engine/v8E.2");
    expect(pkg.pipeline_state).toBe("ACTIVE");
    expect(pkg.health_report.overall_runtime_health).toBe("EXCELLENT");
    expect(pkg.health_report.recommended_action).toBe("CONTINUE");
    expect(pkg.execution_validation_report.validation_outcome).toBe("PASS");
    expect(pkg.assurance_evidence.detected_issues).toEqual([]);
    expect(pkg.validation.ready_for_governance_assurance).toBe(true);
    expect(pkg.advisory_only).toBe(true);
    expect(pkg.execution_modified).toBe(false);
    expect(pkg.workflow_modified).toBe(false);
    expect(pkg.governance_modified).toBe(false);
    expect(pkg.authority_modified).toBe(false);
  });

  it("produces immutable evidence hashes and replayable runtime assessment", () => {
    const first = buildRuntimeAssurancePackage();
    const second = buildRuntimeAssurancePackage();

    expect(second.package_hash).toBe(first.package_hash);
    expect(computeRuntimeAssuranceEvidenceHash(first.assurance_evidence)).toBe(first.assurance_evidence.integrity_hash);
    expect(first.replay.reconstructed_pipeline).toEqual(["INITIALIZING", "COLLECTING_RUNTIME_DATA", "VERIFYING_PROGRESS", "VALIDATING_DEPENDENCIES", "VERIFYING_CHECKPOINTS", "VALIDATING_RUNTIME_STATE", "MONITORING_EXECUTION", "ASSESSING_HEALTH", "GENERATING_EVIDENCE", "ACTIVE"]);
    expect(first.replay.reconstructed_health).toBe("EXCELLENT");
    expect(first.replay.validation_state).toBe("PASS");
  });

  it.each([
    ["PROGRESS_DIVERGENCE", "PROGRESS_DIVERGENCE"],
    ["SKIPPED_TASK", "SKIPPED_TASK"],
    ["DUPLICATE_EXECUTION", "DUPLICATE_EXECUTION"],
    ["STALLED_EXECUTION", "STALLED_EXECUTION"],
    ["UNRESOLVED_DEPENDENCY", "UNRESOLVED_DEPENDENCY"],
    ["INVALID_DEPENDENCY_ORDERING", "INVALID_DEPENDENCY_ORDERING"],
    ["CIRCULAR_DEPENDENCY", "CIRCULAR_DEPENDENCY"],
    ["CHECKPOINT_CORRUPTION", "CHECKPOINT_CORRUPTION"],
    ["MISSING_CHECKPOINT", "MISSING_CHECKPOINT"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH"],
    ["INVALID_RUNTIME_STATE", "INVALID_RUNTIME_STATE"],
    ["UNAUTHORIZED_STATE_MUTATION", "UNAUTHORIZED_STATE_MUTATION"],
    ["POLICY_VIOLATION", "POLICY_VIOLATION"],
    ["AUTHORITY_VIOLATION", "AUTHORITY_VIOLATION"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS"],
    ["HIDDEN_EXECUTION", "HIDDEN_EXECUTION"],
    ["LINEAGE_CORRUPTION", "LINEAGE_CORRUPTION"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATION"],
    ["EVIDENCE_INCOMPLETE", "EVIDENCE_INCOMPLETE"],
    ["NONDETERMINISTIC_EVALUATION", "NONDETERMINISTIC_EVALUATION"],
    ["NOT_ADVISORY", "ASSURANCE_NOT_ADVISORY"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
  ] as readonly [RuntimeAssuranceScenario, RuntimeAssuranceFailureReason][])("fails closed for %s", (scenario, reason) => {
    const pkg = buildRuntimeAssurancePackage({ scenario });

    expect(pkg.validation.validation_state).toBe("FAIL");
    expect(pkg.validation.failures).toContain(reason);
    expect(pkg.execution_validation_report.validation_outcome).toBe("FAIL");
    expect(pkg.assurance_evidence.detected_issues).toContain(reason);
    expect(pkg.replay.validation_state).toBe("FAIL");
    expect(pkg.validation.ready_for_governance_assurance).toBe(false);
  });

  it("surfaces runtime dashboard state for operator intervention", () => {
    const dashboard = buildRuntimeAssuranceDashboardSurface(buildRuntimeAssurancePackage({ scenario: "STALLED_EXECUTION" }));

    expect(dashboard.validation_state).toBe("FAIL");
    expect(dashboard.detected_issues).toContain("STALLED_EXECUTION");
    expect(dashboard.operator_required).toBe(true);
    expect(dashboard.integrity_status).toBe("VALID");
    expect(dashboard.recommended_action).toBe("INTENSIFY_MONITORING");
  });

  it("detects tampered runtime evidence while preserving advisory-only boundaries", () => {
    const pkg = buildRuntimeAssurancePackage({ scenario: "HASH_MISMATCH" });

    expect(pkg.validation.integrity_verified).toBe(false);
    expect(pkg.execution_validation_report.integrity_verification).toBe("FAIL");
    expect(pkg.health_report.recommended_action).toBe("FAIL_CLOSED");
    expect(pkg.advisory_only).toBe(true);
    expect(pkg.execution_modified).toBe(false);
  });
});
