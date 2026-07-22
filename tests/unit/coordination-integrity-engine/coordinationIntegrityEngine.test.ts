import { describe, expect, it } from "vitest";
import {
  computeCoordinationHash,
  createCoordinationIntegrityLedger,
  detectTampering,
  generateIntegrityReport,
  getCoordinationIntegrityEngine,
  replayCoordinationIntegrity,
  validateCoordinationIntegrity,
  validateReplayReferences,
} from "@/services/coordination-integrity-engine";
import type { IntegrityFailure, IntegrityScenario } from "@/types/coordination-integrity-engine";

describe("coordination integrity engine", () => {
  it("publishes the 8ALT.7.6 certified doctrine bundle", () => {
    const bundle = getCoordinationIntegrityEngine();

    expect(bundle.doctrine.contract_version).toBe("coordination-integrity-engine/v8ALT.7.6");
    expect(bundle.doctrine.final_state).toBe("COORDINATION_INTEGRITY_ENGINE_CERTIFIED");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.replay.deterministic).toBe(true);
  });

  it("creates a valid immutable append-only coordination integrity contract", () => {
    const ledger = createCoordinationIntegrityLedger();
    const validation = validateCoordinationIntegrity(ledger);

    expect(validation.contract_valid).toBe(true);
    expect(ledger.contract.immutable).toBe(true);
    expect(ledger.contract.append_only).toBe(true);
    expect(ledger.contract.hash_algorithm).toBe("SHA-256-CANONICAL");
    expect(ledger.contract.integrity_hash).toBeTruthy();
  });

  it("verifies communication, delegation, plan, event, shared state, and replay hashes", () => {
    const validation = validateCoordinationIntegrity();

    expect(validation.communication_hashes_valid).toBe(true);
    expect(validation.delegation_hashes_valid).toBe(true);
    expect(validation.plan_hashes_valid).toBe(true);
    expect(validation.event_hashes_valid).toBe(true);
    expect(validation.shared_state_hashes_valid).toBe(true);
    expect(validation.replay_references_valid).toBe(true);
  });

  it("preserves hash chain completeness, lineage, deterministic replay, governance, and tenant isolation", () => {
    const ledger = createCoordinationIntegrityLedger();
    const validation = validateCoordinationIntegrity(ledger);
    const replay = replayCoordinationIntegrity(ledger);

    expect(validation.hash_chain_complete).toBe(true);
    expect(validation.lineage_preserved).toBe(true);
    expect(validation.deterministic_replay).toBe(true);
    expect(validation.governance_references_preserved).toBe(true);
    expect(validation.constitutional_references_preserved).toBe(true);
    expect(validation.signatures_valid).toBe(true);
    expect(validation.operator_visible).toBe(true);
    expect(validation.tenant_isolated).toBe(true);
    expect(replay.deterministic).toBe(true);
  });

  it("computes deterministic artifact hashes", () => {
    const artifact = { artifact_reference: "artifact:test", payload: { value: 42 } };

    expect(computeCoordinationHash(artifact)).toBe(computeCoordinationHash(artifact));
  });

  it.each([
    ["COMMUNICATION_HASH_MISMATCH", "COMMUNICATION_HASH_MISMATCH_DETECTED"],
    ["DELEGATION_HASH_MISMATCH", "DELEGATION_HASH_MISMATCH_DETECTED"],
    ["PLAN_HASH_CORRUPTION", "PLAN_HASH_CORRUPTION_DETECTED"],
    ["EVENT_HASH_MISMATCH", "COORDINATION_EVENT_HASH_MISMATCH_DETECTED"],
    ["MISSING_COORDINATION_EVENT", "MISSING_COORDINATION_EVENT_DETECTED"],
    ["SHARED_STATE_CORRUPTION", "CORRUPTED_SHARED_STATE_DETECTED"],
    ["REPLAY_REFERENCE_CORRUPTION", "REPLAY_REFERENCE_CORRUPTION_DETECTED"],
    ["ALTERED_MESSAGE", "ALTERED_MESSAGE_DETECTED"],
    ["UNAUTHORIZED_COMMUNICATION_CHANGE", "UNAUTHORIZED_COMMUNICATION_CHANGE_DETECTED"],
    ["BROKEN_HASH_CHAIN", "BROKEN_HASH_CHAIN_DETECTED"],
    ["INVALID_SIGNATURE", "INTEGRITY_SIGNATURE_INVALID"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH_DETECTED"],
    ["CROSS_TENANT_CONTAMINATION", "CROSS_TENANT_INTEGRITY_CONTAMINATION_DETECTED"],
  ] satisfies [IntegrityScenario, IntegrityFailure][])("fails closed for %s", (scenario, failure) => {
    const ledger = createCoordinationIntegrityLedger({ scenario });
    const validation = validateCoordinationIntegrity(ledger);

    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
  });

  it("returns evidence-only tamper reports and integrity reports", () => {
    const reports = detectTampering({ scenario: "ALTERED_MESSAGE" });
    const report = generateIntegrityReport({ scenario: "ALTERED_MESSAGE" });

    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({ tamper_type: "ALTERED_MESSAGE_DETECTED", severity: "CRITICAL" });
    expect(report.status.state).toBe("CORRUPTED");
    expect(report.validation.failures).toContain("ALTERED_MESSAGE_DETECTED");
  });

  it("validates replay references through the public helper", () => {
    expect(validateReplayReferences().replay_references_valid).toBe(true);
    expect(validateReplayReferences({ scenario: "REPLAY_REFERENCE_CORRUPTION" }).failures).toContain("REPLAY_REFERENCE_CORRUPTION_DETECTED");
  });
});
