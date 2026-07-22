import { describe, expect, it } from "vitest";
import {
  getAgentIdentityLifecycleBundle,
  replayAgentIdentityLifecycle,
  runAgentIdentityLifecycle,
  validateAgentIdentityLifecycle,
} from "@/services/caf-agent-identity-lifecycle";
import type { AgentIdentityLifecycleScenario } from "@/types/caf-agent-identity-lifecycle";

describe("Program 3 P3.1 Agent Identity and Lifecycle", () => {
  it("publishes doctrine that inherits P3.0 and leaves CCI identity infrastructure in Program 2", () => {
    const bundle = getAgentIdentityLifecycleBundle();

    expect(bundle.doctrine.version).toBe("caf-agent-identity-lifecycle/v3.1");
    expect(bundle.doctrine.consumes_constitutional_foundation).toBe(true);
    expect(bundle.doctrine.owns_identity_lifecycle_only).toBe(true);
    expect(bundle.doctrine.cci_identity_infrastructure_owner).toBe("Program 2");
    expect(bundle.validation.valid).toBe(true);
  });

  it("creates deterministic agent identities, registry records, and replay hashes", () => {
    const first = runAgentIdentityLifecycle();
    const second = runAgentIdentityLifecycle();

    expect(first.constitutional_ref).toBe("P3.0-CAF-CONSTITUTION-001");
    expect(first.identity.agent_id).toBe("caf.agent.identity.lifecycle.guardian.v1");
    expect(first.identity.deterministic_identity).toBe(true);
    expect(first.identity.collision_free).toBe(true);
    expect(first.registry.immutable).toBe(true);
    expect(first.registry.replayable).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateAgentIdentityLifecycle(first).valid).toBe(true);
    expect(replayAgentIdentityLifecycle(first)).toBe(true);
  });

  it("defines the full governed lifecycle state machine", () => {
    const result = runAgentIdentityLifecycle();

    expect(result.lifecycle_contract.states).toEqual(["REGISTERED", "VALIDATED", "APPROVED", "READY", "ACTIVATED", "ACTIVE", "SUSPENDED", "RESUMING", "UPGRADING", "RETIRED", "ARCHIVED"]);
    expect(result.lifecycle_contract.legal_transitions).toContain("READY->ACTIVATED");
    expect(result.lifecycle_contract.legal_transitions).toContain("ACTIVE->RETIRED");
    expect(result.lifecycle_contract.transition_legal).toBe(true);
    expect(result.lifecycle_contract.retired_reactivation_blocked).toBe(true);
    expect(result.lifecycle_contract.archived_immutable).toBe(true);
  });

  it("governs activation, suspension, recovery, retirement, and version lineage", () => {
    const result = runAgentIdentityLifecycle();

    expect(result.activation.activation_authorized).toBe(true);
    expect(result.activation.authority_approved).toBe(true);
    expect(result.activation.tenant_authorized).toBe(true);
    expect(result.suspension_recovery.suspension_deterministic).toBe(true);
    expect(result.suspension_recovery.recovery_governed).toBe(true);
    expect(result.retirement.history_destroyed).toBe(false);
    expect(result.retirement.replay_compatibility_maintained).toBe(true);
    expect(result.version_lineage.fully_traceable).toBe(true);
    expect(result.version_lineage.rollback_targets).toContain("0.9.0");
  });

  it("captures lifecycle evidence, observability, replay, and certification", () => {
    const result = runAgentIdentityLifecycle();

    expect(result.lifecycle_evidence).toHaveLength(10);
    expect(result.lifecycle_evidence.every((entry, index) => entry.sequence === index + 1 && entry.immutable && entry.replayable)).toBe(true);
    expect(result.observability.complete_visibility).toBe(true);
    expect(result.replay_validation.identity_reconstructed).toBe(true);
    expect(result.replay_validation.evidence_reconstructed).toBe(true);
    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.certified).toBe(true);
    expect(result.certification.tenant_isolation_preserved).toBe(true);
    expect(result.certification.constitutional_compliance).toBe(true);
  });

  it.each([
    "P3_0_CONSTITUTIONAL_BASELINE_INVALID",
    "IDENTITY_COLLISION",
    "NAMESPACE_UNGOVERNED",
    "REGISTRY_MUTABLE",
    "ILLEGAL_LIFECYCLE_TRANSITION",
    "ACTIVATION_WITHOUT_GOVERNANCE",
    "UNAUTHORIZED_TENANT",
    "SUSPENSION_NON_DETERMINISTIC",
    "RECOVERY_UNGOVERNED",
    "RETIREMENT_DESTROYS_HISTORY",
    "VERSION_LINEAGE_INCOMPLETE",
    "LIFECYCLE_EVIDENCE_MISSING",
    "REPLAY_RECONSTRUCTION_FAILED",
    "OBSERVABILITY_GAP",
  ] as const)("fails certification for %s", (scenario: AgentIdentityLifecycleScenario) => {
    const result = runAgentIdentityLifecycle({ scenario });
    const validation = validateAgentIdentityLifecycle(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports pruned certification outcomes", () => {
    const result = runAgentIdentityLifecycle({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
