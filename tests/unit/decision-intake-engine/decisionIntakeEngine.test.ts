import { describe, expect, it } from "vitest";
import {
  buildDecisionIntakeObservability,
  createDecisionCandidatePayload,
  createDecisionIntakeRequest,
  getDecisionIntakeEngine,
  orderDecisionIntakeRequests,
  receiveDecisionBatch,
  receiveDecisionCandidate,
  replayDecisionIntake,
  validateDecisionIntakeRequest,
} from "@/services/decision-intake-engine";
import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import type { DecisionIntakeFailureReason } from "@/types/decision-intake-engine";

function payloadWith(overrides: Parameters<typeof createDecisionCandidatePayload>[0]) {
  const payload = createDecisionCandidatePayload(overrides);
  const rest = { ...payload };
  delete rest.integrity_hash;
  return { ...payload, integrity_hash: generateDecisionIntegrityHash(rest) };
}

describe("decision intake engine", () => {
  it("accepts a valid synchronous candidate and forwards it to normalization", () => {
    const result = receiveDecisionCandidate();

    expect(result.validation_result).toBe("ACCEPTED");
    expect(result.state).toBe("FORWARDED");
    expect(result.forwarded_to_normalization).toBe(true);
    expect(result.intake_sequence).toBe(1);
    expect(result.audit_records.map((record) => record.processing_stage)).toEqual(["RECEIVED", "AUTHENTICATED", "VALIDATING", "VALIDATED", "RECORDED", "FORWARDED"]);
    expect(result.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("supports asynchronous intake without losing deterministic validation", () => {
    const request = createDecisionIntakeRequest({ submission_mode: "ASYNCHRONOUS" });
    const result = receiveDecisionCandidate(request);

    expect(result.processing_mode).toBe("ASYNCHRONOUS");
    expect(result.validation_result).toBe("ACCEPTED");
    expect(result.forwarded_to_normalization).toBe(true);
  });

  it("orders accepted candidates deterministically", () => {
    const later = createDecisionIntakeRequest({
      request_id: "request_later",
      candidate_payload: createDecisionCandidatePayload({ candidate_id: "candidate_z", payload_timestamp: "2026-07-02T09:23:02.000Z", source_record_id: "source_b" }),
    });
    const earlier = createDecisionIntakeRequest({
      request_id: "request_earlier",
      candidate_payload: createDecisionCandidatePayload({ candidate_id: "candidate_a", payload_timestamp: "2026-07-02T09:23:01.000Z", source_record_id: "source_a" }),
    });

    const ordered = orderDecisionIntakeRequests([later, earlier]);
    const batch = receiveDecisionBatch([later, earlier]);

    expect(ordered.map((request) => request.request_id)).toEqual(["request_earlier", "request_later"]);
    expect(batch.validation_result).toBe("ACCEPTED");
    expect(batch.results.map((result) => result.intake_sequence)).toEqual([1, 2]);
  });

  it("rejects atomic batches when any candidate is invalid", () => {
    const good = createDecisionIntakeRequest({ request_id: "request_good" });
    const bad = createDecisionIntakeRequest({
      request_id: "request_bad",
      candidate_payload: createDecisionCandidatePayload({ evidence_refs: [] }),
    });

    const batch = receiveDecisionBatch([good, bad]);

    expect(batch.validation_result).toBe("REJECTED");
    expect(batch.accepted_count).toBe(0);
    expect(batch.results.every((result) => result.forwarded_to_normalization === false)).toBe(true);
  });

  it("supports partial batch acceptance only when explicitly configured", () => {
    const good = createDecisionIntakeRequest({ request_id: "request_good_partial" });
    const bad = createDecisionIntakeRequest({
      request_id: "request_bad_partial",
      candidate_payload: createDecisionCandidatePayload({ replay_refs: [] }),
    });

    const batch = receiveDecisionBatch([good, bad], { partial_acceptance_allowed: true });

    expect(batch.validation_result).toBe("REJECTED");
    expect(batch.accepted_count).toBe(1);
    expect(batch.rejected_count).toBe(1);
  });

  it("replays intake without generating new identifiers", () => {
    const result = receiveDecisionCandidate(createDecisionIntakeRequest({ submission_mode: "REPLAY" }));
    const replay = replayDecisionIntake(result);

    expect(result.processing_mode).toBe("REPLAY");
    expect(replay.replay_valid).toBe(true);
    expect(replay.original_hash).toBe(replay.replayed_hash);
    expect(replay.reconstructed_sequences).toEqual([1]);
  });

  it.each<[
    string,
    ReturnType<typeof createDecisionIntakeRequest>,
    DecisionIntakeFailureReason,
  ]>([
    ["unknown subsystem", createDecisionIntakeRequest({ source_system: "unknown-subsystem" }), "UNKNOWN_SUBSYSTEM"],
    ["unsupported version", createDecisionIntakeRequest({ source_version: "9.9.9" }), "UNSUPPORTED_SOURCE_VERSION"],
    ["unknown tenant", createDecisionIntakeRequest({ tenant_id: "tenant_unknown" }), "UNKNOWN_TENANT"],
    ["tenant mismatch", createDecisionIntakeRequest({ candidate_payload: payloadWith({ tenant_id: "tenant_alpha" }), tenant_id: "tenant_inactive" }), "TENANT_MISMATCH"],
    ["unknown mission", createDecisionIntakeRequest({ mission_id: "mission_unknown" }), "UNKNOWN_MISSION"],
    ["archived mission", createDecisionIntakeRequest({ mission_id: "mission_archived", candidate_payload: payloadWith({ mission_id: "mission_archived" }) }), "ARCHIVED_MISSION"],
    ["missing schema field", createDecisionIntakeRequest({ candidate_payload: createDecisionCandidatePayload({ proposed_action: "" }) }), "MISSING_PROPOSED_ACTION"],
    ["authority escalation", createDecisionIntakeRequest({ candidate_payload: createDecisionCandidatePayload({ authority_metadata: { authority_level: "ADVISORY", advisory_only: true, execution_authorized: true, requested_operations: ["execute"] } }) }), "AUTHORITY_ESCALATION"],
    ["hash mismatch", createDecisionIntakeRequest({ candidate_payload: createDecisionCandidatePayload({ integrity_hash: "tampered" }) }), "HASH_MISMATCH"],
    ["replay corruption", createDecisionIntakeRequest({ candidate_payload: payloadWith({ replay_refs: ["replay_corrupt"] }) }), "REPLAY_CORRUPTION"],
    ["lineage inconsistency", createDecisionIntakeRequest({ candidate_payload: payloadWith({ lineage_refs: [] }) }), "LINEAGE_INCONSISTENCY"],
  ])("rejects %s deterministically", (_name, request, failure) => {
    const validation = validateDecisionIntakeRequest(request);
    const result = receiveDecisionCandidate(request);

    expect(validation.overall_result).toBe("REJECTED");
    expect(validation.failure_reasons).toContain(failure);
    expect(result.validation_result).toBe("REJECTED");
    expect(result.forwarded_to_normalization).toBe(false);
    expect(result.failure_reasons).toContain(failure);
  });

  it("detects duplicate request identifiers", () => {
    const request = createDecisionIntakeRequest({ request_id: "request_duplicate" });
    const validation = validateDecisionIntakeRequest(request, [request]);

    expect(validation.overall_result).toBe("REJECTED");
    expect(validation.failure_reasons).toContain("DUPLICATE_REQUEST_IDENTIFIER");
  });

  it("emits intake observability", () => {
    const accepted = receiveDecisionCandidate();
    const rejected = receiveDecisionCandidate(createDecisionIntakeRequest({ source_system: "unknown-subsystem" }));
    const observability = buildDecisionIntakeObservability([accepted, rejected]);

    expect(observability.candidates_received).toBe(2);
    expect(observability.accepted_candidates).toBe(1);
    expect(observability.rejected_candidates).toBe(1);
    expect(observability.validation_failures).toBeGreaterThan(0);
    expect(observability.replay_accuracy).toBe(1);
    expect(observability.processing_mode_distribution.SYNCHRONOUS).toBe(2);
  });

  it("exposes the intake engine package", () => {
    const engine = getDecisionIntakeEngine();

    expect(engine.sources.length).toBeGreaterThan(0);
    expect(engine.result.validation_result).toBe("ACCEPTED");
    expect(engine.replay.replay_valid).toBe(true);
    expect(engine.observability.accepted_candidates).toBe(1);
  });
});
