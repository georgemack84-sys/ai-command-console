import { describe, expect, it } from "vitest";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import {
  buildGovernanceInterfaceAuditLedger,
  buildGovernanceInterfaceTransaction,
  buildGovernanceInterfaceVisibilitySurface,
  computeGovernanceInterfaceHash,
  getGovernanceInterfacesFramework,
  replayGovernanceInterfaceTransactions,
  validateGovernanceInterfaceTransaction,
} from "@/services/autonomy-governance-interfaces";
import type { GovernanceInterfaceScenario } from "@/types/autonomy-governance-interfaces";

describe("Mission Control Phase 8A.6 Governance Interfaces", () => {
  it("builds deterministic receive and publish transactions", () => {
    const identity = generateAutonomyIdentity();
    const receive = buildGovernanceInterfaceTransaction(identity);
    const publish = buildGovernanceInterfaceTransaction(identity, "PUBLISH_BASELINE");
    expect(receive.direction).toBe("RECEIVE");
    expect(publish.direction).toBe("PUBLISH");
    expect(receive.message_version).toBe("governance-interface/v8A.6");
    expect(computeGovernanceInterfaceHash(receive)).toBe(receive.integrity_hash);
  });

  it("validates a baseline governance transaction", () => {
    const identity = generateAutonomyIdentity();
    const transaction = buildGovernanceInterfaceTransaction(identity);
    const validation = validateGovernanceInterfaceTransaction(identity, transaction);
    expect(validation.validation_state).toBe("PASS");
    expect(validation.decision).toBe("ACCEPTED");
    expect(validation.failures).toEqual([]);
  });

  it.each([
    ["UNAUTHORIZED_EXECUTION", "CONSTITUTIONAL_VIOLATION"],
    ["PRIVILEGE_ESCALATION", "PRIVILEGE_ESCALATION"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_UNAUTHORIZED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION"],
    ["POLICY_VIOLATION", "CONSTITUTIONAL_VIOLATION"],
    ["HIDDEN_TRAFFIC", "HIDDEN_INTERFACE_TRAFFIC"],
    ["UNDOCUMENTED_COMMUNICATION", "REPLAY_REGISTRATION_MISSING"],
    ["REPLAY_OMISSION", "REPLAY_REGISTRATION_MISSING"],
    ["MISSING_LINEAGE", "LINEAGE_REGISTRATION_MISSING"],
    ["INVALID_SCHEMA_VERSION", "INVALID_SCHEMA_VERSION"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["CROSS_TENANT", "TENANT_OWNERSHIP_INVALID"],
    ["MALFORMED_MESSAGE", "SCHEMA_INVALID"],
  ] as readonly [GovernanceInterfaceScenario, string][])("rejects scenario %s", (scenario, reason) => {
    const identity = generateAutonomyIdentity();
    const transaction = buildGovernanceInterfaceTransaction(identity, scenario);
    const validation = validateGovernanceInterfaceTransaction(identity, transaction);
    expect(validation.decision).toBe("REJECTED");
    expect(validation.failures).toContain(reason as never);
  });

  it("records accepted and rejected interface transactions", () => {
    const identity = generateAutonomyIdentity();
    const accepted = buildGovernanceInterfaceTransaction(identity);
    const rejected = buildGovernanceInterfaceTransaction(identity, "HIDDEN_TRAFFIC");
    const ledger = buildGovernanceInterfaceAuditLedger(identity, [accepted, rejected]);
    expect(ledger.transactions).toHaveLength(2);
    expect(ledger.accepted_transactions).toHaveLength(1);
    expect(ledger.rejected_transactions).toHaveLength(1);
    expect(ledger.ledger_hash).toBeTruthy();
  });

  it("replays accepted interface behavior deterministically", () => {
    const identity = generateAutonomyIdentity();
    const ledger = buildGovernanceInterfaceAuditLedger(identity, [buildGovernanceInterfaceTransaction(identity), buildGovernanceInterfaceTransaction(identity, "PUBLISH_BASELINE")]);
    const replay = replayGovernanceInterfaceTransactions(identity, ledger);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.reconstructed_decisions).toEqual(["ACCEPTED", "ACCEPTED"]);
    expect(replay.source_interfaces).toContain("GOVERNANCE_INTELLIGENCE");
    expect(replay.destination_interfaces).toContain("GOVERNANCE_INTELLIGENCE");
  });

  it("detects replay failures for rejected transactions", () => {
    const identity = generateAutonomyIdentity();
    const ledger = buildGovernanceInterfaceAuditLedger(identity, [buildGovernanceInterfaceTransaction(identity, "INTEGRITY_FAILURE")]);
    const replay = replayGovernanceInterfaceTransactions(identity, ledger);
    expect(replay.validation_state).toBe("FAIL");
    expect(replay.failure_reason).toBe("INTEGRITY_VERIFICATION_FAILED");
  });

  it("exposes interface observability without hidden transactions", () => {
    const identity = generateAutonomyIdentity();
    const lifecycle = buildGovernanceInterfaceTransaction(identity, "PUBLISH_BASELINE");
    const ledger = buildGovernanceInterfaceAuditLedger(identity, [buildGovernanceInterfaceTransaction(identity), lifecycle]);
    const visibility = buildGovernanceInterfaceVisibilitySurface(identity, ledger);
    expect(visibility.hidden_transactions_visible).toBe(false);
    expect(visibility.interface_health).toBe("HEALTHY");
    expect(visibility.replay_references.length).toBeGreaterThan(0);
    expect(visibility.governance_interactions).toContain("CONTROLLED_AUTONOMY");
  });

  it("publishes aggregate governance interfaces framework", () => {
    const framework = getGovernanceInterfacesFramework();
    expect(framework.receive_validation.decision).toBe("ACCEPTED");
    expect(framework.publish_validation.decision).toBe("ACCEPTED");
    expect(framework.ledger.transactions).toHaveLength(2);
    expect(framework.visibility.integrity_status).toBe("VALID");
  });
});
