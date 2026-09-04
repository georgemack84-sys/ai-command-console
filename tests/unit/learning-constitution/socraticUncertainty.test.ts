import { describe, expect, it } from "vitest";
import { InMemoryLearningAuditLedger, SocraticHypothesisService, SocraticUncertaintyService } from "@/services/learning-constitution";
import type { SocraticArtifactRecord, SocraticArtifactStore, SocraticHypothesis, SocraticKnowledgeMap } from "@/types/learning-constitution";

const at = "2026-09-02T14:00:00.000Z"; const actor = { actorId: "human:teacher", actorType: "HUMAN" as const };
const store = (): SocraticArtifactStore => { const records: SocraticArtifactRecord[] = []; return { append: async (record) => { records.push(record); return record; }, listArtifacts: async (id) => records.filter((record) => record.subjectId === id), listWorkspaceArtifacts: async () => records }; };
const map: SocraticKnowledgeMap = { mapId: "KM-U", objectiveId: "LO-U", sourceObservationIds: ["OBS-1"], createdAt: at, workingModelOnly: true, nodes: [{ nodeId: "N-known", label: "Known", state: "KNOWN", confidence: 0.9, observationIds: ["OBS-1"], rationale: "Explicit." }, { nodeId: "N-inferred", label: "Why separation", state: "INFERRED", confidence: 0.8, observationIds: ["OBS-1"], rationale: "Decision only." }, { nodeId: "N-unknown", label: "Exceptions", state: "UNKNOWN", confidence: 0, observationIds: [], rationale: "No evidence." }] };
describe("Phase 23B uncertainty engine", () => {
  it("ranks meaningful unknowns above lower-relevance inferred knowledge and excludes known nodes", () => {
    const gaps = new SocraticUncertaintyService().identifyGaps({ sessionId: "SS-U", map, objectiveRelevanceByNodeId: { "N-inferred": 0.4, "N-unknown": 0.9 }, createdAt: at });
    expect(gaps.map((gap) => gap.nodeId)).toEqual(["N-unknown", "N-inferred"]); expect(gaps[0]?.priority).toBeCloseTo(0.9); expect(gaps[1]?.priority).toBeCloseTo(0.08);
    expect(gaps.every((gap) => gap.workingModelOnly)).toBe(true);
  });
  it("retains competing hypothesis revisions and audits a rejected interpretation", async () => {
    const audit = new InMemoryLearningAuditLedger(); const service = new SocraticHypothesisService(store(), audit); const initial: SocraticHypothesis = { hypothesisId: "H-1", sessionId: "SS-U", nodeId: "N-inferred", claim: "The teacher prefers separate services.", state: "PROPOSED", confidence: 0.55, supportingObservationIds: ["OBS-1"], contradictingObservationIds: [], rationale: "A single decision is insufficient.", version: 1, createdBy: actor, createdAt: at, workingModelOnly: true, durableKnowledgeEffect: "NONE", executionPermissionGranted: false };
    const rejected = { ...initial, state: "REJECTED" as const, confidence: 0.1, contradictingObservationIds: ["ANSWER-1"], rationale: "Teacher said a service must solve a concrete problem.", version: 2 };
    await service.record(initial, "workspace:23", "socratic:uncertainty"); await service.revise(initial, rejected, "workspace:23", "socratic:uncertainty");
    expect((await audit.list("workspace:23")).map((entry) => entry.event.eventType)).toEqual(["HYPOTHESIS_CREATED", "HYPOTHESIS_REJECTED"]);
    await expect(service.revise(rejected, { ...rejected, version: 3, state: "SUPPORTED" }, "workspace:23", "invalid")).rejects.toThrow("invalid Socratic hypothesis transition");
  });
});
