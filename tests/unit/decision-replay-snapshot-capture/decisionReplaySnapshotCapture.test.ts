import { describe, expect, it } from "vitest";
import { createDecisionReplayRecord } from "@/services/decision-replay-contract";
import {
  REQUIRED_REPLAY_SNAPSHOT_TYPES,
  computeReplaySnapshotIntegrityHash,
  captureDecisionReplaySnapshots,
  getReplaySnapshotCaptureFoundation,
  serializeReplaySnapshotContent,
} from "@/services/decision-replay-snapshot-capture";
import type { ReplaySnapshotFailure } from "@/types/decision-replay-snapshot-capture";

describe("Mission Control Phase 9.10.2 Replay Snapshot Capture", () => {
  it("publishes the snapshot capture foundation", () => {
    const foundation = getReplaySnapshotCaptureFoundation();

    expect(foundation.capture_version).toBe("decision-replay-snapshot-capture/v1");
    expect(foundation.required_snapshot_types).toEqual(REQUIRED_REPLAY_SNAPSHOT_TYPES);
    expect(foundation.terminal_states).toContain("AVAILABLE_FOR_REPLAY");
    expect(foundation.result.validation.replay_ready).toBe(true);
  });

  it("captures every mandatory orchestration snapshot", () => {
    const result = captureDecisionReplaySnapshots();

    expect(result.snapshots.map((snapshot) => snapshot.snapshot_type)).toEqual(REQUIRED_REPLAY_SNAPSHOT_TYPES);
    expect(result.coverage_report.required_snapshot_count).toBe(10);
    expect(result.coverage_report.captured_snapshot_count).toBe(10);
    expect(result.coverage_report.coverage_percentage).toBe(100);
    expect(result.validation.coverage_complete).toBe(true);
  });

  it("serializes and hashes snapshots deterministically", () => {
    const first = captureDecisionReplaySnapshots();
    const second = captureDecisionReplaySnapshots();

    expect(second).toEqual(first);
    expect(serializeReplaySnapshotContent({ b: 2, a: 1 })).toBe(serializeReplaySnapshotContent({ a: 1, b: 2 }));
    expect(first.snapshots.every((snapshot) => computeReplaySnapshotIntegrityHash(snapshot) === snapshot.integrity_hash)).toBe(true);
    expect(first.validation.serialization_deterministic).toBe(true);
  });

  it("preserves immutable registry, ledger, lineage, replay, governance, and constitutional references", () => {
    const result = captureDecisionReplaySnapshots();

    expect(result.registry).toHaveLength(10);
    expect(result.ledger).toHaveLength(10);
    expect(result.ledger.every((entry, index) => entry.append_only && !entry.deleted && entry.sequence === index + 1)).toBe(true);
    expect(result.snapshots.every((snapshot) => snapshot.lineage_refs.length > 0)).toBe(true);
    expect(result.snapshots.every((snapshot) => snapshot.replay_refs.length > 0)).toBe(true);
    expect(result.snapshots.every((snapshot) => snapshot.governance_refs.length > 0)).toBe(true);
    expect(result.snapshots.every((snapshot) => snapshot.constitutional_refs.length > 0)).toBe(true);
  });

  it.each([
    ["MISSING_SNAPSHOT", "SNAPSHOT_MISSING"],
    ["DUPLICATE_SNAPSHOT", "DUPLICATE_IDENTITY"],
    ["CORRUPTED_SNAPSHOT", "INTEGRITY_MISMATCH"],
    ["INCOMPLETE_LINEAGE", "INCOMPLETE_LINEAGE"],
    ["CROSS_TENANT", "TENANT_MISMATCH"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFS_MISSING"],
    ["MISSING_CONSTITUTIONAL", "CONSTITUTIONAL_REFS_MISSING"],
    ["MISSING_REPLAY_REF", "REPLAY_REFS_MISSING"],
    ["UNSUPPORTED_VERSION", "UNSUPPORTED_VERSION"],
    ["UNKNOWN_STATE", "UNKNOWN_LIFECYCLE_STATE"],
    ["REGISTRY_FAILURE", "REGISTRY_FAILURE"],
    ["LEDGER_FAILURE", "LEDGER_COMMIT_FAILURE"],
  ] as const)("fails closed for %s", (scenario, failure) => {
    const result = captureDecisionReplaySnapshots({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.replay_ready).toBe(false);
    expect(result.validation.failures).toContain(failure);
  });

  it("maintains tenant and orchestration ownership from the replay contract", () => {
    const replay = createDecisionReplayRecord();
    const result = captureDecisionReplaySnapshots({ replay_contract: replay });

    expect(result.snapshots.every((snapshot) => snapshot.tenant_id === replay.tenant_id)).toBe(true);
    expect(result.snapshots.every((snapshot) => snapshot.orchestration_id === replay.orchestration_id)).toBe(true);
    expect(result.mutates_original_orchestration).toBe(false);
    expect(result.advisory_only).toBe(true);
  });

  it("keeps each snapshot schema replay-safe and immutable", () => {
    const result = captureDecisionReplaySnapshots();

    expect(result.snapshots.every((snapshot) => Object.isFrozen(snapshot))).toBe(true);
    expect(result.snapshots.every((snapshot) => snapshot.snapshot_version === "decision-replay-snapshot/v1")).toBe(true);
    expect(result.snapshots.every((snapshot) => snapshot.schema_version === "decision-replay-snapshot-schema/v1")).toBe(true);
    expect(result.snapshots.every((snapshot) => snapshot.lifecycle_state === "AVAILABLE_FOR_REPLAY")).toBe(true);
    expect(result.validation.failures).toEqual([] as ReplaySnapshotFailure[]);
  });
});
