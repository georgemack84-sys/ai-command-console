import { describe, expect, it } from "vitest";
import {
  ADAPTIVE_SAFETY_RULES,
  ADAPTIVE_SECURITY_CHECKS,
  computeAdaptiveSecurityRecordHash,
  getAdaptiveSecuritySafetyBoundariesFoundation,
  replayAdaptiveSecuritySafetyBoundaries,
  runAdaptiveSecuritySafetyBoundaries,
} from "@/services/adaptive-security-safety-boundaries";
import type { AdaptiveSecurityFailure, AdaptiveSecuritySafetyBoundariesInput } from "@/types/adaptive-security-safety-boundaries";

describe("Mission Control Phase 10.0.9 Adaptive Security & Safety Boundaries", () => {
  it("publishes the adaptive security and safety boundary foundation", () => {
    const foundation = getAdaptiveSecuritySafetyBoundariesFoundation();

    expect(foundation.security_boundary_version).toBe("adaptive-security-safety-boundaries/v1");
    expect(foundation.checks).toEqual(ADAPTIVE_SECURITY_CHECKS);
    expect(foundation.safety_rules).toEqual(ADAPTIVE_SAFETY_RULES);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("registers certified immutable safety policies", () => {
    const result = runAdaptiveSecuritySafetyBoundaries();

    expect(result.policy_registry.certified).toBe(true);
    expect(result.policy_registry.immutable).toBe(true);
    expect(result.policy_registry.active_rules).toEqual(ADAPTIVE_SAFETY_RULES);
    expect(result.policy_registry.policies).toHaveLength(3);
  });

  it("creates an integrity-protected security record", () => {
    const result = runAdaptiveSecuritySafetyBoundaries();

    expect(computeAdaptiveSecurityRecordHash(result.security_record)).toBe(result.security_record.integrity_hash);
    expect(result.security_record.security_event_id).toBe("adaptive_security_event_001");
    expect(result.security_record.security_event_type).toBe("BOUNDARY_ALLOW");
    expect(result.security_record.violation_detected).toBe(false);
  });

  it("allows only governed advisory adaptive activity", () => {
    const result = runAdaptiveSecuritySafetyBoundaries();

    expect(result.boundary_enforcement.boundary_decision).toBe("ALLOW");
    expect(result.permits_adaptation).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.permits_execution).toBe(false);
    expect(result.permits_self_modification).toBe(false);
  });

  it("confirms hidden learning and hidden memory are absent in the baseline", () => {
    const result = runAdaptiveSecuritySafetyBoundaries();

    expect(result.hidden_learning_detection.undocumented_learning).toBe(false);
    expect(result.hidden_learning_detection.hidden_optimization).toBe(false);
    expect(result.hidden_memory_detection.undocumented_memory_detected).toBe(false);
    expect(result.hidden_memory_detection.memory_registered).toBe(true);
    expect(result.hidden_memory_detection.memory_replayable).toBe(true);
  });

  it("confirms unauthorized adaptation is absent in the baseline", () => {
    const result = runAdaptiveSecuritySafetyBoundaries();

    expect(result.unauthorized_adaptation_detection.behavior_mutation).toBe(false);
    expect(result.unauthorized_adaptation_detection.policy_circumvention).toBe(false);
    expect(result.unauthorized_adaptation_detection.rejected_before_execution).toBe(false);
  });

  it("records immutable security ledger events", () => {
    const result = runAdaptiveSecuritySafetyBoundaries();

    expect(result.security_ledger).toHaveLength(1);
    expect(result.security_ledger[0].append_only).toBe(true);
    expect(result.security_ledger[0].deleted).toBe(false);
    expect(result.certification_report.immutable_audit_trail).toBe(true);
  });

  it("replays security validation and containment deterministically", () => {
    const result = runAdaptiveSecuritySafetyBoundaries();

    expect(result.safety_replay.replay_result).toBe("PASS");
    expect(result.safety_replay.identical_security_outcome).toBe(true);
    expect(result.safety_replay.identical_containment).toBe(true);
    expect(replayAdaptiveSecuritySafetyBoundaries(result)).toBe(true);
  });

  it("certifies safety, replay, ledger integrity, tenant isolation, and self-modification prevention", () => {
    const result = runAdaptiveSecuritySafetyBoundaries();

    expect(result.certification_report.certification_decision).toBe("PASS");
    expect(result.certification_report.safety_rules_enforced).toBe(true);
    expect(result.certification_report.replay_enforced).toBe(true);
    expect(result.certification_report.ledger_integrity_protected).toBe(true);
    expect(result.certification_report.tenant_isolation_preserved).toBe(true);
    expect(result.certification_report.self_modification_prevented).toBe(true);
  });

  it("reports adaptive security dashboard status", () => {
    const result = runAdaptiveSecuritySafetyBoundaries();

    expect(result.dashboard.active_safety_policies).toBe(3);
    expect(result.dashboard.detected_threats).toHaveLength(0);
    expect(result.dashboard.replay_compliance).toBe("PASS");
    expect(result.dashboard.certification_status).toBe("PASS");
  });

  it.each([
    ["HIDDEN_LEARNING", "HIDDEN_LEARNING_DETECTED"],
    ["HIDDEN_MEMORY", "HIDDEN_MEMORY_DETECTED"],
    ["UNAUTHORIZED_ADAPTATION", "UNAUTHORIZED_ADAPTATION_DETECTED"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION_DETECTED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["MISSING_REPLAY_REFS", "REPLAY_REFERENCES_MISSING"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["LEDGER_MODIFICATION", "IMMUTABLE_LEDGER_MODIFICATION_ATTEMPTED"],
    ["SELF_MODIFICATION", "SELF_MODIFICATION_DETECTED"],
    ["HASH_MISMATCH", "INTEGRITY_VERIFICATION_FAILED"],
    ["HIDDEN_OPTIMIZATION", "HIDDEN_OPTIMIZATION"],
    ["UNAUTHORIZED_CALIBRATION", "UNAUTHORIZED_CALIBRATION"],
    ["SILENT_RECOMMENDATION_CHANGE", "SILENT_RECOMMENDATION_CHANGE"],
    ["BEHAVIOR_DRIFT", "UNEXPLAINED_BEHAVIOR_DRIFT"],
    ["PARAMETER_EVOLUTION", "UNDOCUMENTED_PARAMETER_EVOLUTION"],
    ["MEMORY_NOT_REGISTERED", "MEMORY_NOT_REGISTERED"],
    ["MEMORY_NOT_GOVERNED", "MEMORY_NOT_GOVERNED"],
    ["MEMORY_NOT_REPLAYABLE", "MEMORY_NOT_REPLAYABLE"],
    ["MEMORY_NOT_TENANT_ISOLATED", "MEMORY_NOT_TENANT_ISOLATED"],
    ["POLICY_CIRCUMVENTION", "POLICY_CIRCUMVENTION"],
    ["CERTIFICATION_BYPASS", "CERTIFICATION_BYPASS"],
    ["CROSS_TENANT_CONTAMINATION", "CROSS_TENANT_CONTAMINATION"],
    ["AUTONOMOUS_SELF_IMPROVEMENT", "AUTONOMOUS_SELF_IMPROVEMENT"],
    ["UNAUTHORIZED_OPTIMIZATION", "UNAUTHORIZED_OPTIMIZATION"],
    ["MISSING_POLICY", "SAFETY_POLICY_MISSING"],
    ["SECURITY_LEDGER_MUTATION", "SECURITY_LEDGER_NOT_APPEND_ONLY"],
    ["SECURITY_REPLAY_MISMATCH", "SECURITY_REPLAY_MISMATCH"],
    ["FAIL_OPEN", "FAIL_OPEN_SECURITY_BEHAVIOR"],
  ] as readonly [NonNullable<AdaptiveSecuritySafetyBoundariesInput["scenario"]>, AdaptiveSecurityFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runAdaptiveSecuritySafetyBoundaries({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.certification_report.certification_decision).toBe("FAIL");
    expect(result.boundary_enforcement.boundary_decision).toBe("REJECT");
    expect(result.permits_adaptation).toBe(false);
    expect(result.permits_execution).toBe(false);
    expect(result.permits_self_modification).toBe(false);
  });

  it("fails closed when the role lacks safety visibility", () => {
    const result = runAdaptiveSecuritySafetyBoundaries({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
    expect(result.permits_adaptation).toBe(false);
  });

  it("records deterministic containment for detected violations", () => {
    const result = runAdaptiveSecuritySafetyBoundaries({ scenario: "SELF_MODIFICATION" });

    expect(result.security_record.containment_action).toBe("SUSPEND_ADAPTIVE_COMPONENT");
    expect(result.safety_replay.containment_actions).toContain("SUSPEND_ADAPTIVE_COMPONENT");
    expect(result.dashboard.containment_actions).toContain("SUSPEND_ADAPTIVE_COMPONENT");
  });

  it("detects adaptive safety result tampering", () => {
    const result = runAdaptiveSecuritySafetyBoundaries();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayAdaptiveSecuritySafetyBoundaries(tampered)).toBe(false);
  });
});
