import { describe, expect, it } from "vitest";
import {
  buildReplayHistoricalReconstructionObservabilitySurface,
  getReplayHistoricalReconstructionContract,
  runReplayHistoricalReconstructionQuery,
  validateReplayHistoricalReconstructionQuery,
} from "@/services/replay-historical-reconstruction-query";
import type { ReplayHistoricalReconstructionErrorState, ReplayHistoricalReconstructionScenario } from "@/types/replay-historical-reconstruction-query";

describe("Mission Control Phase 8I.6 Replay & Historical Reconstruction Queries", () => {
  it("defines the read-only replay and historical reconstruction doctrine", () => {
    const contract = getReplayHistoricalReconstructionContract();

    expect(contract.doctrine.schema_version).toBe("replay-historical-reconstruction-query/v8I.6");
    expect(contract.doctrine.principles).toContain("no-inference");
    expect(contract.doctrine.lookup_types).toContain("HISTORICAL_RECONSTRUCTION");
    expect(contract.doctrine.replay_states).toEqual(["REPRODUCED", "MISMATCH", "INCOMPLETE", "INVALID"]);
    expect(contract.doctrine.timeline_categories).toEqual(["MISSION_OBJECTIVE", "PLANNING", "DECISION", "DELEGATION", "ORCHESTRATION", "EXECUTION", "SUPERVISION", "INTERVENTION", "OUTCOME", "REPLAY", "INTEGRITY_VERIFICATION"]);
    expect(contract.doctrine.deterministic_ordering_keys).toEqual(["tenant_id", "mission_id", "timestamp", "autonomy_event_sequence", "record_id"]);
    expect(contract.doctrine.mutation_permitted).toBe(false);
    expect(contract.doctrine.inference_permitted).toBe(false);
  });

  it("reconstructs the complete autonomous lifecycle in canonical order", () => {
    const response = runReplayHistoricalReconstructionQuery();

    expect(response.phase_version).toBe("8I.6");
    expect(response.lookup_state).toBe("LOOKUP_RETURNED");
    expect(response.read_only).toBe(true);
    expect(response.reconstruction_record?.replay_status).toBe("REPRODUCED");
    expect(response.reconstruction_record?.reconstructed_events.map((event) => event.category)).toEqual(["MISSION_OBJECTIVE", "PLANNING", "DECISION", "DELEGATION", "ORCHESTRATION", "EXECUTION", "SUPERVISION", "INTERVENTION", "OUTCOME", "REPLAY", "INTEGRITY_VERIFICATION"]);
    expect(response.reconstruction_record?.missing_events).toEqual([]);
    expect(response.reconstruction_record?.mismatch_events).toEqual([]);
    expect(response.replay_result?.reconstructed_event_count).toBe(11);
    expect(response.audit_record.authorization_result).toBe("APPROVED");
    expect(response.result_hash).toBeTruthy();
  });

  it("links reconstructed events with previous and next event references", () => {
    const events = runReplayHistoricalReconstructionQuery().reconstruction_record?.reconstructed_events ?? [];

    expect(events[0].previous_event_id).toBeNull();
    expect(events[0].next_event_id).toBe(events[1].event_id);
    expect(events[5].previous_event_id).toBe(events[4].event_id);
    expect(events[5].next_event_id).toBe(events[6].event_id);
    expect(events[events.length - 1].next_event_id).toBeNull();
    expect(events.every((event) => event.replay_reference)).toBe(true);
    expect(events.every((event) => event.lineage_reference)).toBe(true);
  });

  it("repeats identical reconstruction queries with identical hashes and ordering", () => {
    const first = runReplayHistoricalReconstructionQuery();
    const second = runReplayHistoricalReconstructionQuery();

    expect(second.result_hash).toBe(first.result_hash);
    expect(second.audit_record.audit_hash).toBe(first.audit_record.audit_hash);
    expect(second.reconstruction_record?.reconstructed_events.map((event) => event.event_hash)).toEqual(first.reconstruction_record?.reconstructed_events.map((event) => event.event_hash));
    expect(second.replay_result?.replay_result_hash).toBe(first.replay_result?.replay_result_hash);
  });

  it("composes existing 8I lookup layers as certified evidence", () => {
    const response = runReplayHistoricalReconstructionQuery();

    expect(response.plan_execution_lookup?.phase_version).toBe("8I.3");
    expect(response.delegation_orchestration_lookup?.phase_version).toBe("8I.4");
    expect(response.supervision_intervention_boundary_lookup?.phase_version).toBe("8I.5");
    expect(response.reconstruction_record?.reconstructed_events.find((event) => event.category === "PLANNING")?.source_record_id).toBe(response.plan_execution_lookup?.plan_record?.plan_id);
    expect(response.reconstruction_record?.reconstructed_events.find((event) => event.category === "DELEGATION")?.source_record_id).toBe(response.delegation_orchestration_lookup?.delegation_records[1].delegation_id);
    expect(response.reconstruction_record?.reconstructed_events.find((event) => event.category === "SUPERVISION")?.source_record_id).toBe(response.supervision_intervention_boundary_lookup?.supervision_records[0].supervision_event_id);
  });

  it("reports incomplete history without inferring missing records", () => {
    const response = runReplayHistoricalReconstructionQuery({ scenario: "MISSING_RECORD_DETECTION" });

    expect(response.lookup_type).toBe("MISSING_RECORD_DETECTION");
    expect(response.reconstruction_record?.replay_status).toBe("INCOMPLETE");
    expect(response.reconstruction_record?.missing_events.map((event) => event.missing_record_type)).toEqual(["REPLAY", "INTEGRITY", "CHECKPOINT"]);
    expect(response.reconstruction_record?.missing_events.every((event) => event.detection_reason.includes("did not infer"))).toBe(true);
    expect(response.replay_result?.missing_record_count).toBe(3);
  });

  it("reports replay mismatches and hash mismatches as distinct replay states", () => {
    const mismatch = runReplayHistoricalReconstructionQuery({ scenario: "MISMATCH_INSPECTION" });
    const invalid = runReplayHistoricalReconstructionQuery({ scenario: "HASH_MISMATCH" });

    expect(mismatch.reconstruction_record?.replay_status).toBe("MISMATCH");
    expect(mismatch.reconstruction_record?.mismatch_events.map((event) => event.mismatch_type)).toEqual(["REPLAY", "LINEAGE"]);
    expect(invalid.reconstruction_record?.replay_status).toBe("INVALID");
    expect(invalid.reconstruction_record?.mismatch_events[0].mismatch_type).toBe("HASH");
  });

  it("supports replay result view queries", () => {
    const response = runReplayHistoricalReconstructionQuery({ scenario: "REPLAY_RESULT_VIEW" });

    expect(response.lookup_type).toBe("REPLAY_RESULT_VIEW");
    expect(response.replay_result?.replay_status).toBe("REPRODUCED");
    expect(response.replay_result?.missing_record_count).toBe(0);
    expect(response.replay_result?.mismatch_count).toBe(0);
    expect(response.replay_result?.replay_reference).toBe(response.replay_reference);
  });

  it.each([
    ["RECONSTRUCTION_NOT_FOUND", "RECONSTRUCTION_NOT_FOUND"],
    ["MISSION_NOT_FOUND", "MISSION_NOT_FOUND"],
    ["REPLAY_RECORD_NOT_FOUND", "REPLAY_RECORD_NOT_FOUND"],
    ["LINEAGE_REFERENCE_INVALID", "LINEAGE_REFERENCE_INVALID"],
    ["INTEGRITY_REFERENCE_INVALID", "INTEGRITY_REFERENCE_INVALID"],
    ["MISSING_HISTORICAL_RECORD", "MISSING_HISTORICAL_RECORD"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH"],
    ["ORDERING_FAILURE", "ORDERING_FAILURE"],
    ["HASH_MISMATCH", "HASH_MISMATCH"],
    ["UNAUTHORIZED", "UNAUTHORIZED"],
    ["TENANT_SCOPE_VIOLATION", "TENANT_SCOPE_VIOLATION"],
    ["VALIDATION_FAILURE", "VALIDATION_FAILURE"],
    ["MUTATION_ATTEMPT", "VALIDATION_FAILURE"],
  ] as readonly [ReplayHistoricalReconstructionScenario, ReplayHistoricalReconstructionErrorState][])(
    "maps %s to %s deterministically",
    (scenario, state) => {
      const response = runReplayHistoricalReconstructionQuery({ scenario });
      const validation = validateReplayHistoricalReconstructionQuery({ scenario });

      expect(response.lookup_state).toBe(state);
      expect(validation.valid).toBe(false);
      expect(response.audit_record.authorization_result).toBe(state === "MISSING_HISTORICAL_RECORD" || state === "REPLAY_MISMATCH" || state === "ORDERING_FAILURE" || state === "HASH_MISMATCH" || state === "INTEGRITY_REFERENCE_INVALID" || state === "REPLAY_RECORD_NOT_FOUND" ? "APPROVED" : "REJECTED");
      expect(response.failures.length).toBeGreaterThan(0);
    },
  );

  it("exposes operator diagnostics for reconstruction failures", () => {
    const surface = buildReplayHistoricalReconstructionObservabilitySurface({ scenario: "TENANT_SCOPE_VIOLATION" });

    expect(surface.lookup_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(surface.errors).toContain("TENANT_SCOPE_VIOLATION");
    expect(surface.reconstructed_event_count).toBe(0);
    expect(surface.audit_hash).toBeTruthy();
  });
});
