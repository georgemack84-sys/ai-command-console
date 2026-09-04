import { describe, expect, it } from "vitest";
import { InMemoryLearningAuditLedger, SocraticKnowledgeMapBuilder, SocraticKnowledgeRetrievalService, SocraticSessionService } from "@/services/learning-constitution";
import type { LearningObjective, SocraticArtifactRecord, SocraticArtifactStore, SocraticKnowledgeSource, SocraticSession } from "@/types/learning-constitution";

const at = "2026-09-02T13:00:00.000Z";
const teacher = { actorId: "human:teacher", actorType: "HUMAN" as const };
const objective: LearningObjective = { objectiveId: "LO-23", objective: "Learn how the teacher approaches system design.", teacher, scope: "GENERAL", scopeId: null, desiredDepth: "HIGH", successCriteria: ["Identify priorities", "Predict a novel decision"], status: "ACTIVE", createdBy: teacher, createdAt: at, durableKnowledgeEffect: "NONE", executionPermissionGranted: false };
const store = (): SocraticArtifactStore => { const records: SocraticArtifactRecord[] = []; return { append: async (record) => { records.push(record); return record; }, listArtifacts: async (id) => records.filter((record) => record.subjectId === id), listWorkspaceArtifacts: async () => records }; };

describe("Phase 23A Socratic session foundation", () => {
  it("retrieves prior knowledge before classifying a provisional map and recording an auditable session", async () => {
    const source: SocraticKnowledgeSource = { retrieve: async () => [{ observationId: "DEC-1", sourceType: "DECISION", sourceId: "D-1", scope: "GENERAL", summary: "The teacher separates responsibilities when failure isolation is valuable.", confidence: 0.8, createdAt: at }, { observationId: "PREF-1", sourceType: "PREFERENCE", sourceId: "P-1", scope: "GENERAL", summary: "The teacher values explicit component boundaries.", confidence: 0.9, createdAt: at }] };
    const observations = await new SocraticKnowledgeRetrievalService([source]).retrieve(objective);
    const map = new SocraticKnowledgeMapBuilder().build({ mapId: "KM-23", objective, dimensions: ["Component boundaries", "Failure isolation", "Operational simplicity"], observations, createdAt: at });
    expect(map.nodes.map((node) => [node.label, node.state])).toEqual([["Component boundaries", "KNOWN"], ["Failure isolation", "INFERRED"], ["Operational simplicity", "UNKNOWN"]]);
    const session: SocraticSession = { sessionId: "SS-23", objectiveId: objective.objectiveId, status: "ACTIVE", knowledgeMapId: map.mapId, questionBudget: { preferred: 3, maximum: 5 }, questionsAsked: [], uncertaintyBefore: 0.66, uncertaintyCurrent: 0.66, informationGain: 0, createdBy: teacher, createdAt: at, durableLearningStatus: "NOT_YET_EVALUATED", durableKnowledgeEffect: "NONE", executionPermissionGranted: false };
    const audit = new InMemoryLearningAuditLedger(); await new SocraticSessionService(store(), audit).start({ objective, knowledgeMap: map, session, workspaceId: "workspace:23", correlationId: "socratic:23" });
    expect((await audit.list("workspace:23")).map((entry) => entry.event.eventType)).toEqual(["LEARNING_OBJECTIVE_DEFINED", "KNOWLEDGE_MAP_CREATED", "SOCRATIC_SESSION_STARTED"]);
    expect(session).toMatchObject({ durableLearningStatus: "NOT_YET_EVALUATED", durableKnowledgeEffect: "NONE", executionPermissionGranted: false });
  });
  it("rejects a non-human teacher and an invalid question budget", async () => {
    const map = new SocraticKnowledgeMapBuilder().build({ mapId: "KM-24", objective, dimensions: ["Tradeoffs"], observations: [], createdAt: at }); const badTeacher = { ...objective, teacher: { actorId: "agent:noesis", actorType: "AGENT" as const } }; const session: SocraticSession = { sessionId: "SS-24", objectiveId: objective.objectiveId, status: "ACTIVE", knowledgeMapId: map.mapId, questionBudget: { preferred: 5, maximum: 3 }, questionsAsked: [], uncertaintyBefore: 1, uncertaintyCurrent: 1, informationGain: 0, createdBy: teacher, createdAt: at, durableLearningStatus: "NOT_YET_EVALUATED", durableKnowledgeEffect: "NONE", executionPermissionGranted: false };
    await expect(new SocraticSessionService(store()).start({ objective: badTeacher, knowledgeMap: map, session, workspaceId: "workspace:23", correlationId: "socratic:24" })).rejects.toThrow("human teacher");
    await expect(new SocraticSessionService(store()).start({ objective, knowledgeMap: map, session, workspaceId: "workspace:23", correlationId: "socratic:25" })).rejects.toThrow("invalid Socratic session foundation");
  });
});
