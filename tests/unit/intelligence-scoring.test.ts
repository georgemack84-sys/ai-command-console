import { describe, expect, it } from "vitest";
import type { MonitoredUpdate, Source } from "@prisma/client";
import { scoreInsight } from "@/src/server/intelligence/scoring";

describe("intelligence scoring", () => {
  it("scores higher for critical updates with relevant keywords", () => {
    const update: MonitoredUpdate = {
      id: "u1",
      workspaceId: "w1",
      sourceId: "s1",
      title: "Outage detected in EU region",
      summary: "Incident reported with customer impact.",
      status: "new",
      severity: "critical",
      category: "Operations",
      happenedAt: new Date(),
      createdAt: new Date(),
      metadata: null,
    };
    const source: Source = {
      id: "s1",
      workspaceId: "w1",
      name: "Ops Feed",
      type: "integration",
      status: "healthy",
      url: null,
      updateCadence: "Hourly",
      description: "Ops",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const score = scoreInsight(update, source);
    expect(score.totalScore).toBeGreaterThan(50);
    expect(score.keywordScore).toBeGreaterThan(0);
  });
});
