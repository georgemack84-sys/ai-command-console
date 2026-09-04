import { describe, expect, it } from "vitest";
import { LearningAnalyticsAggregationService, LearningAnalyticsService, LearningInsightsService } from "@/services/learning-constitution";
import type { LearningAnalyticsArtifactRecord, LearningAnalyticsArtifactStore, LearningSession, LearningTelemetryEvent } from "@/types/learning-constitution";

const at = "2026-09-03T22:00:00.000Z";
const actor = { actorId: "agent:phase-36", actorType: "AGENT" as const };
const memoryStore = (): LearningAnalyticsArtifactStore => {
  const records = new Map<string, LearningAnalyticsArtifactRecord>();
  return {
    append: async (artifact) => {
      const existing = records.get(artifact.artifactId);
      if (existing) return existing;
      records.set(artifact.artifactId, artifact);
      return artifact;
    },
    listArtifacts: async (subjectId) => [...records.values()].filter((artifact) => artifact.subjectId === subjectId),
    listWorkspaceArtifacts: async () => [...records.values()],
  };
};

describe("Phase 36 acceptance: analytics inform governed learning without exercising authority", () => {
  it("captures immutable telemetry, produces reproducible observations, and gates a strategy hypothesis behind review", async () => {
    const artifacts = memoryStore();
    const analytics = new LearningAnalyticsService(artifacts);
    const session: LearningSession = { sessionId: "LS-ACCEPT-36", goal: "Practice evidence calibration", skillIds: ["SK-CALIBRATION"], strategies: [{ strategy: "PRACTICE_DRIVEN", proportion: 1 }], resourceIds: ["RESOURCE-36"], startedAt: at, completedAt: null, status: "ACTIVE", createdBy: actor, immutable: true, learningEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    await analytics.start(session);
    const event = (eventId: string, type: LearningTelemetryEvent["type"], payload: Record<string, unknown>): LearningTelemetryEvent => ({ eventId, sessionId: session.sessionId, type, payload, eventTime: at, ingestedAt: at, idempotencyKey: `idem:${eventId}`, immutable: true });
    const telemetry = [event("E1", "ASSESSMENT", { score: 45 }), event("E2", "PROMPT", {}), event("E3", "CORRECTION", {}), event("E4", "HUMAN_INTERVENTION", {}), event("E5", "TOKEN_USAGE", { total: 420 }), event("E6", "ASSESSMENT", { score: 75 })];
    for (const item of telemetry) await analytics.record(item);
    await analytics.record(telemetry[0]);
    expect((await artifacts.listArtifacts(session.sessionId)).filter((artifact) => artifact.artifactType === "TELEMETRY")).toHaveLength(6);

    const snapshot = await analytics.snapshot({ snapshotId: "SNAP-ACCEPT-36", session, events: telemetry, algorithmVersion: "LEA-v1", metricDefinitionVersion: "metrics-v1", configuration: { assessmentScale: 100 }, computedAt: at });
    const trend = new LearningAnalyticsAggregationService().trend({ trendId: "TREND-ACCEPT-36", strategy: "PRACTICE_DRIVEN", sessions: [session, { ...session, sessionId: "LS-ACCEPT-37" }, { ...session, sessionId: "LS-ACCEPT-38" }], snapshots: [snapshot, { ...snapshot, snapshotId: "SNAP-ACCEPT-37", sessionId: "LS-ACCEPT-37" }, { ...snapshot, snapshotId: "SNAP-ACCEPT-38", sessionId: "LS-ACCEPT-38" }], retention: [{ sessionId: session.sessionId, checkpoint: "SHORT_TERM", score: 82, valid: true, observedAt: at }], createdAt: at });
    const insights = new LearningInsightsService();
    const insight = insights.createInsight({ insightId: "INSIGHT-ACCEPT-36", trend, kind: "STRATEGY_OBSERVATION", createdAt: at });
    const hypothesis = insights.hypothesis({ hypothesisId: "HYPOTHESIS-ACCEPT-36", insight, strategy: "SOCRATIC", createdAt: at });

    expect(snapshot).toMatchObject({ immediateGain: 30, correctionCount: 1, humanInterventionCount: 1, promptCount: 1, totalTokens: 420, projectionOnly: true, authorityEffect: "UNCHANGED", executionPermissionGranted: false });
    expect(trend).toMatchObject({ interpretation: "OBSERVED_ASSOCIATION", causalClaim: false, state: "WEAK_PATTERN", authorityEffect: "UNCHANGED", executionPermissionGranted: false });
    expect(hypothesis).toMatchObject({ status: "PROPOSED", requiresGovernedReview: true, autonomousPlanChangeAuthorized: false, authorityEffect: "UNCHANGED", executionPermissionGranted: false });
  });
});
