import { describe, expect, it } from "vitest";
import {
  buildMissionKnowledgeCaptureObservabilitySurface,
  captureMissionKnowledge,
  getMissionKnowledgeCaptureEngine,
  listMissionKnowledgeAuditRecords,
  listMissionKnowledgeEvidence,
  listMissionKnowledgeRecords,
  normalizeMissionKnowledge,
  validateMissionKnowledgeCapture,
} from "@/services/mission-knowledge-capture-engine";
import type { MissionKnowledgeCaptureFailure, MissionKnowledgeScenario } from "@/types/mission-knowledge-capture-engine";

describe("mission knowledge capture engine", () => {
  it("publishes the deterministic capture engine bundle", () => {
    const bundle = getMissionKnowledgeCaptureEngine();

    expect(bundle.doctrine.engine_version).toBe("mission-knowledge-capture-engine/v8ALT.9.2");
    expect(bundle.doctrine.final_state).toBe("MISSION_KNOWLEDGE_CAPTURE_ENGINE_READY");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.capture.capture_only).toBe(true);
    expect(bundle.capture.learning_execution_authorized).toBe(false);
    expect(bundle.capture.optimization_authority).toBe(false);
    expect(bundle.capture.activation_authority).toBe(false);
  });

  it("captures completed mission knowledge records deterministically", () => {
    const capture = captureMissionKnowledge();

    expect(capture.final_state).toBe("MISSION_KNOWLEDGE_CAPTURED");
    expect(capture.records.length).toBeGreaterThan(0);
    expect(capture.records.every((record) => record.lifecycle_state === "RECORDED")).toBe(true);
    expect(capture.records.every((record) => record.evidence_references.length > 0)).toBe(true);
    expect(capture.records.every((record) => record.replay_references.length > 0)).toBe(true);
    expect(capture.records.every((record) => record.lineage_references.length > 0)).toBe(true);
  });

  it("lists records, normalized records, evidence, and audit records", () => {
    expect(listMissionKnowledgeRecords().length).toBeGreaterThan(0);
    expect(normalizeMissionKnowledge().length).toBeGreaterThan(0);
    expect(listMissionKnowledgeEvidence().length).toBeGreaterThan(0);
    expect(listMissionKnowledgeAuditRecords().length).toBe(0);
  });

  it("keeps capture separate from learning and activation", () => {
    const capture = captureMissionKnowledge();

    expect(capture.records.every((record) => record.capture_only)).toBe(true);
    expect(capture.records.every((record) => !record.learning_execution_authorized)).toBe(true);
    expect(capture.records.every((record) => !record.optimization_authority)).toBe(true);
    expect(capture.records.every((record) => !record.activation_authority)).toBe(true);
    expect(capture.records.every((record) => !record.historical_truth_mutable)).toBe(true);
  });

  it.each([
    ["INCOMPLETE_MISSION_RECORD", "INCOMPLETE_MISSION_RECORD"],
    ["MISSING_REPLAY_REFERENCE", "REPLAY_REFERENCE_MISSING"],
    ["CORRUPTED_EVIDENCE", "CORRUPTED_EVIDENCE_DETECTED"],
    ["INTEGRITY_MISMATCH", "INTEGRITY_MISMATCH_DETECTED"],
    ["GOVERNANCE_VIOLATION", "GOVERNANCE_VIOLATION_DETECTED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION_DETECTED"],
    ["DUPLICATE_DETERMINISTIC_IDENTIFIER", "DUPLICATE_DETERMINISTIC_IDENTIFIER_DETECTED"],
    ["ORPHANED_LINEAGE", "ORPHANED_LINEAGE_DETECTED"],
    ["UNAUTHORIZED_KNOWLEDGE_SOURCE", "UNAUTHORIZED_KNOWLEDGE_SOURCE_DETECTED"],
    ["CROSS_TENANT_CAPTURE_ATTEMPT", "CROSS_TENANT_CAPTURE_DETECTED"],
    ["HISTORICAL_MUTATION_ATTEMPT", "HISTORICAL_MUTATION_DETECTED"],
    ["LEARNING_EXECUTION_ATTEMPTED", "LEARNING_EXECUTION_ATTEMPTED"],
    ["ACTIVATION_ATTEMPTED", "ACTIVATION_ATTEMPTED"],
  ] satisfies [MissionKnowledgeScenario, MissionKnowledgeCaptureFailure][])("fails closed and audits %s", (scenario, failure) => {
    const capture = captureMissionKnowledge({ scenario });
    const validation = validateMissionKnowledgeCapture(capture);

    expect(capture.final_state).toBe("MISSION_KNOWLEDGE_CAPTURE_REJECTED");
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
    expect(capture.audit_records.some((record) => record.rejection_reason === failure)).toBe(true);
  });

  it("publishes capture observability", () => {
    const surface = buildMissionKnowledgeCaptureObservabilitySurface();

    expect(surface.final_state).toBe("MISSION_KNOWLEDGE_CAPTURED");
    expect(surface.record_count).toBeGreaterThan(0);
    expect(surface.audit_count).toBe(0);
    expect(surface.learning_execution_authorized).toBe(false);
    expect(surface.activation_authority).toBe(false);
    expect(surface.integrity_hash).toBeTruthy();
  });
});
