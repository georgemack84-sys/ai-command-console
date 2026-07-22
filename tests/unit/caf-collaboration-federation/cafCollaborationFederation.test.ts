import { describe, expect, it } from "vitest";
import {
  getCollaborationFederationBundle,
  replayCollaborationFederation,
  runCollaborationFederation,
  validateCollaborationFederation,
} from "@/services/caf-collaboration-federation";
import type { CollaborationFederationScenario } from "@/types/caf-collaboration-federation";

describe("Program 3 P3.6 Collaboration and Federation", () => {
  it("publishes collaboration doctrine without owning CCI messaging infrastructure", () => {
    const bundle = getCollaborationFederationBundle();

    expect(bundle.doctrine.version).toBe("caf-collaboration-federation/v3.6");
    expect(bundle.doctrine.consumes_planning_reasoning).toBe(true);
    expect(bundle.doctrine.owns_collaboration_not_messaging_infrastructure).toBe(true);
    expect(bundle.doctrine.secure_federation_required).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("creates deterministic collaboration and replay records", () => {
    const first = runCollaborationFederation();
    const second = runCollaborationFederation();

    expect(first.planning_reasoning_ref).toBe("caf-planning-reasoning/v3.5");
    expect(first.cci_messaging_ref).toBe("Program 2 - CCI Messaging Infrastructure");
    expect(first.collaboration.collaboration_deterministic).toBe(true);
    expect(first.collaboration.shared_state_governed).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateCollaborationFederation(first).valid).toBe(true);
    expect(replayCollaborationFederation(first)).toBe(true);
  });

  it("certifies delegation, negotiation, federation, interoperability, and context governance", () => {
    const result = runCollaborationFederation();

    expect(result.delegation.authority_preserved).toBe(true);
    expect(result.delegation.replayable).toBe(true);
    expect(result.negotiation.deterministic).toBe(true);
    expect(result.federation.trust_established).toBe(true);
    expect(result.federation.session_secure).toBe(true);
    expect(result.interoperability.contracts_validated).toBe(true);
    expect(result.shared_context.visibility_governed).toBe(true);
    expect(result.shared_context.tenant_isolated).toBe(true);
  });

  it("validates governance, audit, replay, observability, and approval for P3.7", () => {
    const result = runCollaborationFederation();

    expect(result.governance.authority_validated).toBe(true);
    expect(result.trust_security.partner_verification_complete).toBe(true);
    expect(result.evidence).toHaveLength(9);
    expect(result.replay_validation.deterministic).toBe(true);
    expect(result.observability.complete_visibility).toBe(true);
    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.certified).toBe(true);
    expect(result.certification.approved_for_p3_7).toBe(true);
  });

  it.each([
    "P3_5_PLANNING_REASONING_INVALID",
    "COLLABORATION_MODEL_INCOMPLETE",
    "SHARED_STATE_UNGOVERNED",
    "UNAUTHORIZED_DELEGATION",
    "DELEGATION_AUTHORITY_LOST",
    "NON_DETERMINISTIC_NEGOTIATION",
    "FEDERATION_TRUST_FAILURE",
    "FEDERATION_SESSION_UNSECURED",
    "INTEROPERABILITY_CONTRACT_VIOLATION",
    "CONTEXT_VISIBILITY_BYPASS",
    "COLLABORATION_GOVERNANCE_BYPASS",
    "PARTNER_VALIDATION_INCOMPLETE",
    "OBSERVABILITY_GAP",
    "AUDIT_GAP",
    "REPLAY_INCONSISTENCY",
    "TENANT_ISOLATION_VIOLATION",
  ] as const)("fails certification for %s", (scenario: CollaborationFederationScenario) => {
    const result = runCollaborationFederation({ scenario });
    const validation = validateCollaborationFederation(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports pruned certification outcomes", () => {
    const result = runCollaborationFederation({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
