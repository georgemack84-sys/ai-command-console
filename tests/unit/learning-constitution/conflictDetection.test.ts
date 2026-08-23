import { describe, expect, it } from "vitest";

import { ConservativeConflictDetector } from "@/services/learning-constitution";
import type {
  KnowledgeComparisonSubject,
  KnowledgeScopeReference,
} from "@/types/learning-constitution";

const provenance = {
  observationId: "observation-001",
  sourceId: "interaction-001",
  sourceType: "OPERATOR_STATEMENT" as const,
  originatingActorId: "operator-001",
  observedAt: "2026-08-20T12:00:00.000Z",
};

const projectAlpha: KnowledgeScopeReference = {
  type: "PROJECT",
  id: "project-alpha",
  displayName: "Project Alpha",
};
const projectBeta: KnowledgeScopeReference = {
  type: "PROJECT",
  id: "project-beta",
  displayName: "Project Beta",
};

const subject = (
  knowledgeId: string,
  overrides: Partial<KnowledgeComparisonSubject> = {},
): KnowledgeComparisonSubject => ({
  knowledgeId,
  content: "Project Alpha uses PostgreSQL.",
  classification: "PROJECT_DECISION",
  scope: projectAlpha,
  provenance,
  semanticKey: "project.primary-database",
  value: "PostgreSQL",
  qualifiers: [],
  ...overrides,
});

const detector = new ConservativeConflictDetector();

describe("conservative conflict detection", () => {
  it("identifies a same-scope exact duplicate without mutating either record", async () => {
    const result = await detector.detect({
      candidate: subject("candidate-001"),
      existingKnowledge: subject("knowledge-001"),
    });

    expect(result).toMatchObject({
      relationship: "DUPLICATES",
      status: "ASSESSED",
      persistenceEffect: "NONE",
      authorityEffect: "UNCHANGED",
    });
  });

  it("excludes different project scopes instead of treating their differences as a conflict", async () => {
    const result = await detector.detect({
      candidate: subject("candidate-alpha"),
      existingKnowledge: subject("knowledge-beta", {
        scope: projectBeta,
        content: "Project Beta uses SQLite.",
        value: "SQLite",
      }),
    });

    expect(result).toMatchObject({
      relationship: "UNRELATED",
      status: "OUT_OF_SCOPE",
      scopeCompatibility: { outcome: "INCOMPATIBLE" },
    });
  });

  it("identifies a same-scope exclusive value mismatch as a contradiction", async () => {
    const result = await detector.detect({
      candidate: subject("candidate-sqlite", { value: "SQLite" }),
      existingKnowledge: subject("knowledge-postgres"),
    });

    expect(result).toMatchObject({
      relationship: "CONTRADICTS",
      requiresValidation: true,
      requiresApproval: true,
    });
  });

  it("identifies additional detail as a refinement", async () => {
    const result = await detector.detect({
      candidate: subject("candidate-refined", { qualifiers: ["version:18"] }),
      existingKnowledge: subject("knowledge-base"),
    });

    expect(result.relationship).toBe("REFINES");
  });

  it("identifies conditional detail as a qualification", async () => {
    const result = await detector.detect({
      candidate: subject("candidate-qualified", { qualifiers: ["when:production"] }),
      existingKnowledge: subject("knowledge-base"),
    });

    expect(result.relationship).toBe("QUALIFIES");
  });

  it("identifies constraints as narrowing detail", async () => {
    const result = await detector.detect({
      candidate: subject("candidate-narrowed", { qualifiers: ["constraint:managed-service"] }),
      existingKnowledge: subject("knowledge-base"),
    });

    expect(result.relationship).toBe("NARROWS");
  });

  it("detects a correction reference but does not supersede its target", async () => {
    const result = await detector.detect({
      candidate: subject("candidate-correction", {
        classification: "CORRECTION",
        supersedesKnowledgeIds: ["knowledge-17"],
      }),
      existingKnowledge: subject("knowledge-17", { value: "PostgreSQL 17" }),
    });

    expect(result).toMatchObject({
      relationship: "CORRECTS",
      correctionTargetKnowledgeId: "knowledge-17",
      requiresValidation: true,
      requiresApproval: true,
      persistenceEffect: "NONE",
    });
  });

  it("detects an exception reference while preserving the general rule", async () => {
    const result = await detector.detect({
      candidate: subject("candidate-exception", {
        classification: "EXCEPTION",
        exceptionToKnowledgeIds: ["deployment-approval-rule"],
      }),
      existingKnowledge: subject("deployment-approval-rule", {
        semanticKey: "deployment.approval",
        value: "required",
      }),
    });

    expect(result).toMatchObject({
      relationship: "CREATES_EXCEPTION",
      exceptionTargetKnowledgeId: "deployment-approval-rule",
      requiresValidation: true,
      requiresApproval: true,
    });
  });

  it("fails closed when a same-scope comparison lacks structured semantics", async () => {
    const result = await detector.detect({
      candidate: subject("candidate-uncertain", {
        content: "Use the recommended database.",
        semanticKey: undefined,
        value: undefined,
      }),
      existingKnowledge: subject("knowledge-uncertain", {
        content: "Use the approved database.",
        semanticKey: undefined,
        value: undefined,
      }),
    });

    expect(result).toMatchObject({
      relationship: "UNCERTAIN",
      status: "UNCERTAIN",
      requiresClarification: true,
      requiresValidation: true,
    });
  });

  it("never creates persistence or authority side effects", async () => {
    const result = await detector.detect({
      candidate: subject("candidate-001", { value: "SQLite" }),
      existingKnowledge: subject("knowledge-001"),
    });

    expect(result.persistenceEffect).toBe("NONE");
    expect(result.authorityEffect).toBe("UNCHANGED");
  });
});
