import { describe, expect, it, vi } from "vitest";
import {
  appendRuntimeAssuranceLedger,
  certifyRuntimeAssuranceLedger,
  computeRuntimeLedgerPackageHash,
  getRuntimeAssuranceLedgerContract,
  publishRuntimeAssuranceLedger,
  replayRuntimeAssuranceLedger,
  validateRuntimeAssuranceLedger,
} from "@/services/runtime-assurance-ledger";
import type { RuntimeLedgerFailure, RuntimeLedgerScenario } from "@/types/runtime-assurance-ledger";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.1G Runtime Assurance Ledger", () => {
  it("defines ledger doctrine, lifecycle, evidence types, and restrictions", () => {
    const contract = getRuntimeAssuranceLedgerContract();

    expect(contract.doctrine.ledger_version).toBe("runtime-assurance-ledger/v8ALT.1G");
    expect(contract.doctrine.principles).toContain("append-only");
    expect(contract.doctrine.principles).toContain("cryptographically-verifiable");
    expect(contract.doctrine.lifecycle).toEqual(["CREATE_RECORD", "VALIDATE_RECORD", "VERIFY_GOVERNANCE", "VERIFY_CONSTITUTION", "VERIFY_INTEGRITY", "GENERATE_HASH", "APPEND_LEDGER", "VALIDATE_REPLAY", "PUBLISH_RECORD"]);
    expect(contract.doctrine.evidence_types).toEqual(["RUNTIME_ASSURANCE", "DRIFT_INTELLIGENCE", "RECOMMENDATION", "GOVERNANCE", "CONSTITUTIONAL", "REPLAY", "INTEGRITY"]);
    expect(contract.doctrine.restrictions).toContain("cannot alter committed historical records");
  });

  it("appends a certified immutable baseline ledger package", () => {
    const pkg = appendRuntimeAssuranceLedger();
    const validation = validateRuntimeAssuranceLedger(pkg);
    const certification = certifyRuntimeAssuranceLedger(pkg);

    expect(pkg.ledger_version).toBe("runtime-assurance-ledger/v8ALT.1G");
    expect(pkg.entries.length).toBe(1);
    expect(pkg.entries[0]?.append_only).toBe(true);
    expect(pkg.entries[0]?.immutable).toBe(true);
    expect(pkg.evidence_registry.length).toBe(7);
    expect(pkg.chain.every((item) => item.chain_status === "VALID")).toBe(true);
    expect(pkg.audit_index.ledger_entries).toContain(pkg.entries[0]?.ledger_entry_id);
    expect(validation.valid).toBe(true);
    expect(certification.certified).toBe(true);
    expect(certification.authoritative_historical_record).toBe(true);
  });

  it.each([
    ["MISSING_RECORD", "MISSING_RECORD"],
    ["ORPHANED_LINEAGE", "ORPHANED_LINEAGE"],
    ["REPLAY_DIVERGENENCE", "MISSING_RECORD"],
    ["BROKEN_HASH_CHAIN", "BROKEN_HASH_CHAIN"],
    ["INTEGRITY_MISMATCH", "INTEGRITY_MISMATCH"],
    ["DUPLICATE_ENTRY", "DUPLICATE_ENTRY"],
    ["OUT_OF_ORDER_INSERTION", "OUT_OF_ORDER_INSERTION"],
    ["UNAUTHORIZED_MODIFICATION", "UNAUTHORIZED_MODIFICATION"],
    ["CROSS_TENANT_CONTAMINATION", "CROSS_TENANT_CONTAMINATION"],
    ["EXECUTION_AUTHORITY_ATTEMPT", "UNAUTHORIZED_EXECUTION_CAPABILITY"],
  ] as readonly [RuntimeLedgerScenario, RuntimeLedgerFailure][])(
    "fails closed for %s",
    (scenario, failure) => {
      const pkg = appendRuntimeAssuranceLedger({ scenario });
      const validation = validateRuntimeAssuranceLedger(pkg);
      const certification = certifyRuntimeAssuranceLedger(pkg);

      expect(validation.valid).toBe(false);
      expect(validation.failures).toContain(failure);
      expect(certification.certified).toBe(false);
      expect(certification.authoritative_historical_record).toBe(false);
    },
  );

  it("replays ledger ordering, chain hashes, and package hash deterministically", () => {
    const first = appendRuntimeAssuranceLedger();
    const second = appendRuntimeAssuranceLedger();
    const replay = replayRuntimeAssuranceLedger(first);

    expect(second.ledger_hash).toBe(first.ledger_hash);
    expect(first.ledger_hash).toBe(computeRuntimeLedgerPackageHash(first));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_entry_order).toEqual(first.entries.map((entry) => entry.ledger_entry_id));
    expect(replay.reconstructed_chain_hashes).toEqual(first.chain.map((item) => item.chain_hash));
  });

  it("publishes audit-ready ledger surface without execution authority", () => {
    const pkg = appendRuntimeAssuranceLedger();
    const surface = publishRuntimeAssuranceLedger(pkg);

    expect(surface.entries).toBe(1);
    expect(surface.evidence_records).toBe(7);
    expect(surface.chain_status).toBe("VALID");
    expect(surface.audit_ready).toBe(true);
    expect(surface.append_only).toBe(true);
    expect(pkg.execution_authorized).toBe(false);
    expect(pkg.execution_modified).toBe(false);
    expect(pkg.historical_records_modified).toBe(false);
  });
});
