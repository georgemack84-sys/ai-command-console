import { beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const learningAdvisoryPath = require.resolve("../../services/learningAdvisory.js");
const reviewSurfacePath = require.resolve("../../services/reviewSurface.js");

function loadLearningRuntime() {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
  for (const modulePath of [learningAdvisoryPath, reviewSurfacePath, stateDatabasePath]) {
    delete require.cache[modulePath];
  }

  const stateDatabase = require("../../services/stateDatabase.js");
  const learningAdvisory = require("../../services/learningAdvisory.js");
  const reviewSurface = require("../../services/reviewSurface.js");

  stateDatabase.saveDocument(learningAdvisory.LEARNING_STATE_KEY, learningAdvisory.defaultLearningState(), {
    legacyPath: learningAdvisory.LEARNING_STATE_PATH,
  });
  stateDatabase.withDatabase((db: any) => {
    db.exec(`
      DELETE FROM pattern_approvals;
      DELETE FROM learning_patterns;
    `);
  });

  return {
    stateDatabase,
    learningAdvisory,
    reviewSurface,
  };
}

beforeEach(() => {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
});

describe("learning advisory governance", () => {
  it("computes effective confidence with temporal decay through a single function", () => {
    const { learningAdvisory } = loadLearningRuntime();
    const now = Date.parse("2026-04-24T00:00:00.000Z");
    const lastSeenAt = "2026-04-14T00:00:00.000Z";

    const score = learningAdvisory.computeEffectiveConfidence(1, 0.1, lastSeenAt, now);

    expect(score).toBeCloseTo(Math.exp(-1), 5);
  });

  it("keeps detected patterns in shadow mode until approval and promotion", () => {
    const { learningAdvisory, stateDatabase } = loadLearningRuntime();

    try {
      for (let index = 0; index < 10; index += 1) {
        learningAdvisory.recordLearningEvent({
          id: `event_${index}`,
          sessionId: index < 5 ? "session_a" : "session_b",
          actorId: "operator_1",
          actorRole: "operator",
          requestKey: "manager:route",
          reviewMode: "standard",
          outcome: "executed",
          reasonCode: "DELTA_COMPARISON_AVAILABLE",
          evidenceComplete: true,
        });
      }

      learningAdvisory.upsertDetectedPatterns({});
      const shadowAdvisory = learningAdvisory.buildLearningAdvisory({});
      expect(shadowAdvisory.available).toBe(false);
      expect(shadowAdvisory.hints).toEqual([]);
      expect(shadowAdvisory.shadowSignals.length).toBeGreaterThan(0);

      learningAdvisory.upsertDetectedPatterns({});
      const patterns = learningAdvisory.listLearningPatterns();
      expect(patterns).toHaveLength(1);
      expect(patterns[0]).toEqual(expect.objectContaining({ mode: "shadow", validationStatus: "validated" }));

      const approval = learningAdvisory.approveLearningPattern(patterns[0].id, "operator_1", "promote pattern");
      expect(approval).toBeTruthy();

      const promoted = learningAdvisory.promoteLearningPattern(patterns[0].id, "operator_1", "activate");
      expect(promoted.ok).toBe(true);

      const activeAdvisory = learningAdvisory.buildLearningAdvisory({});
      expect(activeAdvisory.available).toBe(true);
      expect(activeAdvisory.dataGrounded).toBe(true);
      expect(activeAdvisory.hints).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            reasonCode: "DELTA_COMPARISON_AVAILABLE",
            sourceType: "learning_patterns",
          }),
        ]),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("blocks promotion when outcomes conflict inside the oscillation window", () => {
    const { learningAdvisory, stateDatabase } = loadLearningRuntime();

    try {
      for (let index = 0; index < 10; index += 1) {
        learningAdvisory.recordLearningEvent({
          id: `event_${index}`,
          sessionId: index < 5 ? "session_a" : "session_b",
          actorId: "operator_1",
          actorRole: "operator",
          requestKey: "policy:update-thresholds",
          reviewMode: "standard",
          outcome: index % 2 === 0 ? "executed" : "failed",
          reasonCode: "CONFIRMATION_REQUIRED",
          evidenceComplete: true,
        });
      }

      learningAdvisory.upsertDetectedPatterns({});
      const patterns = learningAdvisory.listLearningPatterns();
      const pattern = patterns[0];
      expect(pattern.validationStatus).toBe("conflicting");

      const approval = learningAdvisory.approveLearningPattern(pattern.id, "operator_1", "attempt promotion");
      expect(approval).toBeTruthy();

      const promoted = learningAdvisory.promoteLearningPattern(pattern.id, "operator_1", "should fail");
      expect(promoted).toEqual(
        expect.objectContaining({
          ok: false,
        }),
      );

      const advisory = learningAdvisory.buildLearningAdvisory({});
      expect(advisory.hints).toEqual([]);
      expect(advisory.shadowSignals).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            validationStatus: "conflicting",
          }),
        ]),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("keeps reviewSurface learning helpers wired to the governed learning module", () => {
    const { reviewSurface, learningAdvisory, stateDatabase } = loadLearningRuntime();

    try {
      reviewSurface.setLearningMode("advisory_applied", { id: "operator_1" }, "enable");
      const state = learningAdvisory.loadLearningState();
      expect(state.mode).toBe("advisory_applied");

      reviewSurface.resetLearningState({ id: "operator_1" }, "reset");
      const resetState = learningAdvisory.loadLearningState();
      expect(resetState.mode).toBe("observation_only");
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("does not import execution, router, or planner modules into the governed learning layer", () => {
    const source = fs.readFileSync(learningAdvisoryPath, "utf8");

    expect(source).not.toMatch(/require\(["']\.\/executionEngine["']\)/);
    expect(source).not.toMatch(/require\(["']\.\/toolRouter["']\)/);
    expect(source).not.toMatch(/require\(["']\.\/planner["']\)/);
    expect(source).not.toMatch(/require\(["']\.\/runtimeControl["']\)/);
    expect(source).not.toMatch(/require\(["']\.\/stepController["']\)/);
  });
});
