import { describe, expect, it } from "vitest";
import { InMemoryLearningAuditLedger, SocraticQuestionArtifactService, SocraticQuestionIntelligenceService } from "@/services/learning-constitution";
import type { SocraticArtifactRecord, SocraticArtifactStore } from "@/types/learning-constitution";

const at = "2026-09-02T15:00:00.000Z"; const actor = { actorId: "human:teacher", actorType: "HUMAN" as const };
const store = (): SocraticArtifactStore => { const records: SocraticArtifactRecord[] = []; return { append: async (record) => { records.push(record); return record; }, listArtifacts: async (id) => records.filter((record) => record.subjectId === id), listWorkspaceArtifacts: async () => records }; };
describe("Phase 23C Socratic question intelligence", () => {
  it("selects one high-value counterfactual and excludes a leading confirmation question", async () => {
    const intelligence = new SocraticQuestionIntelligenceService(); const leading = intelligence.score({ candidateId: "QC-leading", sessionId: "SS-Q", question: "Would you agree that modularity should always win?", questionType: "PRIORITY", targetNodeIds: ["N-1"], hypothesisIds: ["H-1"], uncertaintyReduction: 0.9, objectiveRelevance: 0.9, hypothesisSeparation: 0.9, reuseValue: 0.8, humanEffort: "LOW", createdAt: at }); const discriminating = intelligence.score({ candidateId: "QC-best", sessionId: "SS-Q", question: "If separation improved isolation but doubled operational complexity, what would determine your choice?", questionType: "COUNTERFACTUAL", targetNodeIds: ["N-1", "N-2"], hypothesisIds: ["H-1", "H-2"], uncertaintyReduction: 0.92, objectiveRelevance: 0.97, hypothesisSeparation: 0.88, reuseValue: 0.81, humanEffort: "MODERATE", createdAt: at });
    const selected = intelligence.select([leading, discriminating], 0, 5, actor, at); expect(selected).toMatchObject({ candidateId: "QC-best", questionBudgetPosition: 1 }); expect(leading.leadingBiasRisk).toBe(1);
    const audit = new InMemoryLearningAuditLedger(); await new SocraticQuestionArtifactService(store(), audit).recordAndSelect({ candidates: [leading, discriminating], selected, workspaceId: "workspace:23", correlationId: "socratic:questions" }); expect((await audit.list("workspace:23")).map((entry) => entry.event.eventType)).toEqual(["QUESTION_CANDIDATES_GENERATED", "QUESTION_SELECTED"]);
  });
  it("enforces the one-question rule and the teacher budget", () => {
    const intelligence = new SocraticQuestionIntelligenceService(); expect(() => intelligence.score({ candidateId: "QC-bad", sessionId: "SS-Q", question: "What matters? Why?", questionType: "CLARIFICATION", targetNodeIds: ["N-1"], hypothesisIds: [], uncertaintyReduction: 0.4, objectiveRelevance: 0.4, hypothesisSeparation: 0.4, reuseValue: 0.4, humanEffort: "LOW", createdAt: at })).toThrow("invalid Socratic question candidate"); expect(() => intelligence.select([], 3, 3, actor, at)).toThrow("budget exhausted");
  });
});
