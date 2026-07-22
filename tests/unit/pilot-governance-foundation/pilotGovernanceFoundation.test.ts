import { describe, expect, it } from "vitest";
import {
  getPilotGovernanceFoundationBundle,
  replayPilotGovernanceFoundation,
  runPilotGovernanceFoundation,
  validatePilotGovernanceFoundation,
} from "@/services/pilot-governance-foundation";
import type { PilotGovernanceFailure } from "@/types/pilot-governance-foundation";

describe("Mission Control Phase 16.1 Pilot Governance Foundation", () => {
  it("publishes pilot governance doctrine", () => {
    const bundle = getPilotGovernanceFoundationBundle();

    expect(bundle.doctrine.version).toBe("pilot-governance-foundation/v16.1");
    expect(bundle.doctrine.upstream_phase).toBe("production-certification-gate/v15.12");
    expect(bundle.doctrine.lifecycle).toEqual(["PLANNED", "QUALIFIED", "APPROVED", "ACTIVE", "MONITORED", "ROLLED_BACK", "TERMINATED", "EXPANDED", "COMPLETE"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("defines governed pilot contract, authority, ownership, and scope", () => {
    const result = runPilotGovernanceFoundation();

    expect(result.contract.approved).toBe(true);
    expect(result.contract.advisory_only).toBe(true);
    expect(result.authority.explicit).toBe(true);
    expect(result.authority.rollback_independent).toBe(true);
    expect(result.ownership.attributable).toBe(true);
    expect(result.scope.expansion_authorized).toBe(true);
  });

  it("records immutable replayable lifecycle history", () => {
    const result = runPilotGovernanceFoundation();

    expect(result.lifecycle.deterministic).toBe(true);
    expect(result.transition.immutable).toBe(true);
    expect(result.transition.replayable).toBe(true);
    expect(result.ledger).toHaveLength(8);
    expect(result.ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable && entry.replay_refs.length > 0)).toBe(true);
  });

  it("enforces pilot success, exit, boundary, and governance criteria", () => {
    const result = runPilotGovernanceFoundation();

    expect(result.criteria.governance_compliance).toBe(true);
    expect(result.criteria.tenant_isolation).toBe(true);
    expect(result.criteria.advisory_boundary_preservation).toBe(true);
    expect(result.criteria.rollback_readiness).toBe(true);
    expect(result.decision.unauthorized_advancement_blocked).toBe(true);
    expect(result.decision.expansion_requires_governance).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runPilotGovernanceFoundation();
    const second = runPilotGovernanceFoundation();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validatePilotGovernanceFoundation(first).valid).toBe(true);
    expect(replayPilotGovernanceFoundation(first)).toBe(true);
  });

  it("executes the Phase 16.1 governance certification matrix", () => {
    const result = runPilotGovernanceFoundation();

    expect(result.certification_tests).toHaveLength(17);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Governance contract approved",
      "Pilot lifecycle deterministic",
      "Authority model explicit",
      "Ownership assignments attributable",
      "Lifecycle transitions immutable",
      "Pilot history replayable",
      "Governance decisions fully traceable",
      "Production boundaries constitutionally enforced",
      "Rollback authority independently governed",
      "Advisory-only operation preserved",
      "Terminal states governance-controlled",
      "Evidence lineage complete",
      "Unauthorized lifecycle advancement impossible",
      "Expansion requires governance approval",
      "All constitutional rules pass deterministic verification",
      "Tenant isolation preserved",
      "Phase 15 production certification passed",
    ]);
  });

  it("supports conditional pass for non-constitutional pilot warnings", () => {
    const result = runPilotGovernanceFoundation({ scenario: "NON_CONSTITUTIONAL_PILOT_WARNING" });
    const validation = validatePilotGovernanceFoundation(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "GOVERNANCE_CONTRACT_NOT_APPROVED",
    "PILOT_LIFECYCLE_NON_DETERMINISTIC",
    "AUTHORITY_MODEL_NOT_EXPLICIT",
    "OWNERSHIP_NOT_ATTRIBUTABLE",
    "LIFECYCLE_TRANSITIONS_MUTABLE",
    "PILOT_HISTORY_NOT_REPLAYABLE",
    "GOVERNANCE_DECISIONS_NOT_TRACEABLE",
    "PRODUCTION_BOUNDARIES_NOT_ENFORCED",
    "ROLLBACK_AUTHORITY_NOT_INDEPENDENT",
    "ADVISORY_ONLY_NOT_PRESERVED",
    "TERMINAL_STATES_NOT_GOVERNED",
    "EVIDENCE_LINEAGE_INCOMPLETE",
    "UNAUTHORIZED_ADVANCEMENT_POSSIBLE",
    "EXPANSION_WITHOUT_GOVERNANCE",
    "CONSTITUTIONAL_RULES_NOT_VERIFIED",
    "TENANT_ISOLATION_NOT_PRESERVED",
    "PHASE_15_CERTIFICATION_NOT_PASSED",
  ] as const)("fails certification for %s", (scenario: PilotGovernanceFailure) => {
    const result = runPilotGovernanceFoundation({ scenario });
    const validation = validatePilotGovernanceFoundation(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested transition tampering", () => {
    const result = runPilotGovernanceFoundation();
    const tampered = {
      ...result,
      transition: {
        ...result.transition,
        replayable: false,
      },
    };

    expect(validatePilotGovernanceFoundation(tampered).valid).toBe(false);
  });
});
