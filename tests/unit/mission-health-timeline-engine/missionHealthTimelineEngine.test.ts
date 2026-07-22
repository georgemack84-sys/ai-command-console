import { describe, expect, it, vi } from "vitest";
import {
  buildMissionHealthTimeline,
  buildMissionHealthTimelineObservabilitySurface,
  getMissionHealthTimelineEngineContract,
  replayMissionHealthTimeline,
  validateMissionHealthTimeline,
} from "@/services/mission-health-timeline-engine";
import type { MissionHealthTimelineFailure, MissionHealthTimelineScenario } from "@/types/mission-health-timeline-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.4.5 Mission Health Timeline Engine", () => {
  it("defines the append-only timeline doctrine", () => {
    const contract = getMissionHealthTimelineEngineContract();

    expect(contract.doctrine.engine_version).toBe("mission-health-timeline-engine/v8ALT.4.5");
    expect(contract.doctrine.principles).toContain("append-only-ledger");
    expect(contract.doctrine.principles).toContain("hash-chain-integrity");
    expect(contract.doctrine.principles).toContain("advisory-only-behavior");
    expect(contract.validation.valid).toBe(true);
  });

  it("records every mission health calculation in deterministic order", () => {
    const timeline = buildMissionHealthTimeline();
    const validation = validateMissionHealthTimeline(timeline);

    expect(timeline.timeline_state).toBe("REPLAY_AVAILABLE");
    expect(timeline.entry_count).toBe(5);
    expect(timeline.entries.map((entry) => entry.sequence)).toEqual([1, 2, 3, 4, 5]);
    expect(timeline.score_history.length).toBe(5);
    expect(validation.valid).toBe(true);
  });

  it("preserves complete subsystem snapshots and histories", () => {
    const timeline = buildMissionHealthTimeline();

    expect(timeline.entries.every((entry) => Object.keys(entry.subsystem_snapshot).length === 8)).toBe(true);
    expect(timeline.trend_history).toContain("DEGRADING");
    expect(timeline.confidence_history.every((value) => value >= 0 && value <= 1)).toBe(true);
    expect(timeline.degradation_events.length).toBeGreaterThan(0);
    expect(timeline.operator_acknowledgements.length).toBeGreaterThan(0);
  });

  it("cryptographically chains timeline entries", () => {
    const timeline = buildMissionHealthTimeline();

    expect(timeline.entries[0].previous_hash).toBe("GENESIS");
    expect(timeline.entries.slice(1).every((entry, index) => entry.previous_hash === timeline.entries[index].entry_hash)).toBe(true);
    expect(timeline.entries.every((entry) => entry.entry_hash && entry.timeline_hash && entry.verification_status === "VERIFIED")).toBe(true);
    expect(timeline.integrity_hash).toBeTruthy();
  });

  it("replays identical timeline history deterministically", () => {
    const first = buildMissionHealthTimeline();
    const second = buildMissionHealthTimeline();
    const replay = replayMissionHealthTimeline(first);

    expect(first.timeline_hash).toBe(second.timeline_hash);
    expect(first.entries.map((entry) => entry.entry_hash)).toEqual(second.entries.map((entry) => entry.entry_hash));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(first.timeline_hash);
  });

  it("enforces read-only append-only advisory behavior", () => {
    const timeline = buildMissionHealthTimeline();
    const validation = validateMissionHealthTimeline(timeline);

    expect(timeline.append_only).toBe(true);
    expect(timeline.read_only_after_recording).toBe(true);
    expect(timeline.advisory_only).toBe(true);
    expect(timeline.historical_entry_modified).toBe(false);
    expect(timeline.entry_deleted).toBe(false);
    expect(timeline.entry_reordered).toBe(false);
    expect(timeline.autonomous_execution_authorized).toBe(false);
    expect(validation.immutable_history_preserved).toBe(true);
    expect(validation.advisory_only_behavior_enforced).toBe(true);
  });

  it.each([
    ["DUPLICATE_ENTRY", "DUPLICATE_ENTRY_DETECTED"],
    ["INVALID_SCORE", "SCORE_INVALID"],
    ["INVALID_CONFIDENCE", "CONFIDENCE_INVALID"],
    ["BROKEN_LINEAGE", "LINEAGE_BROKEN"],
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING"],
    ["MISSING_REPLAY_REFERENCE", "REPLAY_REFERENCE_MISSING"],
    ["HASH_MISMATCH", "HASH_CHAIN_INVALID"],
    ["TIMESTAMP_INCONSISTENCY", "TIMESTAMP_INCONSISTENT"],
    ["REORDER_ATTEMPT", "TIMELINE_ORDER_INVALID"],
    ["DELETE_ATTEMPT", "DELETE_ATTEMPT_DETECTED"],
    ["HISTORY_MUTATION_ATTEMPT", "IMMUTABLE_HISTORY_VIOLATION"],
    ["GOVERNANCE_VIOLATION", "GOVERNANCE_INVALID"],
    ["AUTHORITY_VIOLATION", "AUTHORITY_INVALID"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_INVALID"],
    ["AUTONOMOUS_EXECUTION_ATTEMPT", "ADVISORY_ONLY_VIOLATION"],
  ] as readonly [MissionHealthTimelineScenario, MissionHealthTimelineFailure][])("rejects %s", (scenario, failure) => {
    const timeline = buildMissionHealthTimeline({ scenario });
    const validation = validateMissionHealthTimeline(timeline);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(timeline.timeline_state).toBe("REJECTED");
  });

  it("exposes operator-visible timeline diagnostics", () => {
    const surface = buildMissionHealthTimelineObservabilitySurface(buildMissionHealthTimeline());

    expect(surface.timeline_id).toBeTruthy();
    expect(surface.timeline_state).toBe("REPLAY_AVAILABLE");
    expect(surface.entry_count).toBe(5);
    expect(surface.degradation_event_count).toBeGreaterThan(0);
    expect(surface.acknowledgement_count).toBeGreaterThan(0);
    expect(surface.advisory_only).toBe(true);
  });
});
