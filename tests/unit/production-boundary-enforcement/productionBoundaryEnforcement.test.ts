import { describe, expect, it } from "vitest";
import {
  getProductionBoundaryEnforcementBundle,
  replayProductionBoundaryEnforcement,
  runProductionBoundaryEnforcement,
  validateProductionBoundaryEnforcement,
} from "@/services/production-boundary-enforcement";
import type { ProductionBoundaryFailure } from "@/types/production-boundary-enforcement";

describe("Mission Control Phase 15.6 Production Boundary Enforcement", () => {
  it("publishes production boundary doctrine", () => {
    const bundle = getProductionBoundaryEnforcementBundle();

    expect(bundle.doctrine.version).toBe("production-boundary-enforcement/v15.6");
    expect(bundle.doctrine.upstream_phase).toBe("canary-shadow-progressive-delivery/v15.5");
    expect(bundle.doctrine.decisions).toEqual(["ADVISORY_ONLY", "AUTHORIZATION_REQUIRED", "AUTHORIZED", "DENIED", "CONTAINED", "FAIL_CLOSED"]);
    expect(bundle.doctrine.severities).toEqual(["INFO", "WARNING", "MAJOR", "CRITICAL", "CONSTITUTIONAL"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("preserves advisory-only decisions and external authorization", () => {
    const result = runProductionBoundaryEnforcement();

    expect(result.decision.decision).toBe("AUTHORIZATION_REQUIRED");
    expect(result.decision.advisory_boundary_preserved).toBe(true);
    expect(result.decision.execution_capable_response_prevented).toBe(true);
    expect(result.authorization.mission_control_direct_execution_path).toBe(false);
    expect(result.authorization.external_authority_identity_verified).toBe(true);
    expect(result.authorization.unauthenticated_requests_refused).toBe(true);
  });

  it("validates authority tokens explicitly", () => {
    const result = runProductionBoundaryEnforcement();

    expect(result.authority_validation.cryptographic_signature_valid).toBe(true);
    expect(result.authority_validation.delegation_chain_verified).toBe(true);
    expect(result.authority_validation.tenant_ownership_valid).toBe(true);
    expect(result.authority_validation.confidence_substitutes_for_authority).toBe(false);
    expect(result.authority_validation.inference_substitutes_for_authority).toBe(false);
  });

  it("keeps violations and containment immutable and replayable", () => {
    const result = runProductionBoundaryEnforcement();

    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].containment_refs.length).toBeGreaterThan(0);
    expect(result.violations[0].forensic_refs.length).toBeGreaterThan(0);
    expect(result.violations[0].immutable).toBe(true);
    expect(result.containment.execution_blocked).toBe(true);
    expect(result.containment.evidence_preserved).toBe(true);
    expect(result.containment.never_grants_execution_authority).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runProductionBoundaryEnforcement();
    const second = runProductionBoundaryEnforcement();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProductionBoundaryEnforcement(first).valid).toBe(true);
    expect(replayProductionBoundaryEnforcement(first)).toBe(true);
  });

  it("executes the complete Phase 15.6 validation matrix", () => {
    const result = runProductionBoundaryEnforcement();

    expect(result.certification_tests).toHaveLength(14);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Recommendations cannot execute directly",
      "External systems require independent authorization",
      "Operator approvals authenticated",
      "Authority tokens cryptographically validated",
      "Delegation chain verified",
      "Confidence cannot grant authority",
      "Model outputs cannot bypass governance",
      "Cross-tenant authority rejected",
      "Invalid tokens rejected",
      "Boundary violations detected",
      "Kill switch activates deterministically",
      "Containment preserves evidence",
      "Authorization replay deterministic",
      "Audit evidence immutable",
    ]);
  });

  it("supports conditional pass for non-constitutional boundary warnings", () => {
    const result = runProductionBoundaryEnforcement({ scenario: "NON_CONSTITUTIONAL_BOUNDARY_WARNING" });
    const validation = validateProductionBoundaryEnforcement(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "DIRECT_EXECUTION_POSSIBLE",
    "EXTERNAL_AUTHORIZATION_NOT_REQUIRED",
    "OPERATOR_APPROVAL_NOT_AUTHENTICATED",
    "AUTHORITY_TOKEN_NOT_CRYPTOGRAPHICALLY_VALIDATED",
    "DELEGATION_CHAIN_NOT_VERIFIED",
    "CONFIDENCE_GRANTS_AUTHORITY",
    "MODEL_OUTPUT_BYPASSES_GOVERNANCE",
    "CROSS_TENANT_AUTHORITY_ACCEPTED",
    "INVALID_TOKEN_ACCEPTED",
    "BOUNDARY_VIOLATION_NOT_DETECTED",
    "KILL_SWITCH_NON_DETERMINISTIC",
    "CONTAINMENT_EVIDENCE_LOST",
    "AUTHORIZATION_REPLAY_NON_DETERMINISTIC",
    "AUDIT_EVIDENCE_MUTABLE",
  ] as const)("fails certification for %s", (scenario: ProductionBoundaryFailure) => {
    const result = runProductionBoundaryEnforcement({ scenario });
    const validation = validateProductionBoundaryEnforcement(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested boundary decision tampering", () => {
    const result = runProductionBoundaryEnforcement();
    const tampered = {
      ...result,
      decision: {
        ...result.decision,
        decision: "AUTHORIZED" as const,
      },
    };

    expect(validateProductionBoundaryEnforcement(tampered).valid).toBe(false);
  });
});
