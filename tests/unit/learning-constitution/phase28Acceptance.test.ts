import { describe, expect, it } from "vitest";
import { ExecutionStopConditionService, GovernedExecutionOutcomeService, GovernedExecutionSummaryService, GovernedExecutionTimelineService, GovernedLearningExecutionGate, GovernedMechanismDispatcher } from "@/services/learning-constitution";
import type { GovernedExecutionArtifactRecord, GovernedExecutionArtifactStore } from "@/types/learning-constitution";

const at = "2026-09-03T12:00:00.000Z";
const store = (): GovernedExecutionArtifactStore => { const records: GovernedExecutionArtifactRecord[] = []; return { append: async (record) => { records.push(record); return record; }, listArtifacts: async (subjectId) => records.filter((record) => record.subjectId === subjectId), listWorkspaceArtifacts: async () => records }; };

describe("Phase 28 integrated acceptance", () => {
  it("executes only an active, scoped capability and leaves durable learning, adjacent gaps, and future work governed", async () => {
    const artifacts = store();
    const lease = { leaseId: "LEASE-28", proposalId: "PROPOSAL-28", approvalId: "APPROVAL-28", scope: "SYSTEM_DESIGN", method: "SOCRATIC_INTERVIEW" as const, maximumQuestions: 2, issuedBy: { actorId: "human:teacher", actorType: "HUMAN" as const }, issuedAt: at, expiresAt: "2026-09-04T12:00:00.000Z", status: "ACTIVE" as const };
    const action = { actionId: "ACTION-28", curriculumId: "CURRICULUM-28", lease, mechanism: "SOCRATIC_INTERVIEW" as const, targetSkillId: "SKILL-28", scope: "SYSTEM_DESIGN", questionCost: 1, attemptCost: 0, evaluationCost: 0, executedAt: at };
    const budget = { questionLimit: 5, attemptLimit: 2, evaluationLimit: 1, questionsUsed: 0, attemptsUsed: 0, evaluationsUsed: 0 };
    const gate = new GovernedLearningExecutionGate();
    const authorization = gate.authorize(action, budget, at);
    expect(authorization.allowed).toBe(true);
    expect(gate.authorize({ ...action, scope: "ADJACENT_TEAM_MANAGEMENT" }, budget, at).reason).toBe("SCOPE_DRIFT");
    expect(gate.authorize(action, budget, "2026-09-05T12:00:00.000Z").reason).toBe("LEASE_EXPIRED");

    let engineRuns = 0;
    const dispatch = new GovernedMechanismDispatcher(gate, { SOCRATIC_INTERVIEW: { execute: async () => { engineRuns += 1; } } });
    expect((await dispatch.dispatch(action, budget, at)).dispatched).toBe(true);
    expect(engineRuns).toBe(1);

    const timeline = new GovernedExecutionTimelineService(artifacts);
    await timeline.start({ sessionId: "SESSION-28", curriculumId: action.curriculumId, leaseId: lease.leaseId, status: "RUNNING", startedAt: at, haltedAt: null, haltReason: null, durableKnowledgeEffect: "NONE", executionPermissionGranted: false });
    await timeline.record(gate.timeline(action, authorization));
    const outcome = new GovernedExecutionOutcomeService(artifacts);
    await outcome.record({ outcomeId: "OUTCOME-28", sessionId: "SESSION-28", actionId: action.actionId, route: "TEACH_BACK", evidenceIds: ["EVIDENCE-28"], directDurableWrite: false, createdAt: at });
    await outcome.deferUnauthorizedGap({ candidateGapId: "GAP-28", sessionId: "SESSION-28", actionId: action.actionId, subject: "Adjacent team management", discoveredScope: "ADJACENT_TEAM_MANAGEMENT", evidenceIds: ["EVIDENCE-28"], pursued: false, requiresNewProposal: true, createdAt: at });
    const stop = new ExecutionStopConditionService().evaluate({ teacherStop: true, recentInformationGains: [], consecutiveFailures: 0, failureThreshold: 3, now: at });
    await timeline.recordStop({ sessionId: "SESSION-28", curriculumId: action.curriculumId, leaseId: lease.leaseId, condition: stop!, occurredAt: at });
    await new GovernedExecutionSummaryService(artifacts).record({ summaryId: "SUMMARY-28", sessionId: "SESSION-28", curriculumId: action.curriculumId, leaseId: lease.leaseId, status: "HALTED", budget: authorization.remaining, outcomeIds: ["OUTCOME-28"], deferredGapIds: ["GAP-28"], durableKnowledgeEffect: "NONE", furtherExecutionAuthorized: false, createdAt: at });
    expect((await artifacts.listWorkspaceArtifacts()).map((artifact) => artifact.artifactType)).toEqual(expect.arrayContaining(["SESSION", "TIMELINE", "STOP_CONDITION", "OUTCOME", "CANDIDATE_GAP", "SUMMARY"]));
  });
});
