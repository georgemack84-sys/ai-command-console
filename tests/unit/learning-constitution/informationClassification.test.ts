import { describe, expect, it } from "vitest";

import { ConservativeInformationClassifier } from "@/services/learning-constitution";
import {
  CLASSIFICATION_SEMANTICS,
  KNOWLEDGE_CLASSIFICATIONS,
  type InformationClassificationRequest,
} from "@/types/learning-constitution";

const request = (
  content: string,
  overrides: Partial<InformationClassificationRequest> = {},
): InformationClassificationRequest => ({
  content,
  provenance: {
    observationId: "observation-001",
    sourceId: "interaction-001",
    sourceType: "OPERATOR_STATEMENT",
    originatingActorId: "operator-001",
    observedAt: "2026-08-20T12:00:00.000Z",
  },
  ...overrides,
});

const classifier = new ConservativeInformationClassifier();

describe("canonical information classification", () => {
  it.each([
    ["I think Rust might be interesting someday.", "CONVERSATION"],
    ["Let's explore PostgreSQL.", "BRAINSTORMING"],
    ["We could use PostgreSQL.", "SUGGESTION"],
    ["Fact: PostgreSQL is a relational database.", "FACT"],
    ["I prefer PostgreSQL.", "PREFERENCE"],
    ["Use PostgreSQL for this implementation.", "INSTRUCTION"],
    ["We decided to use PostgreSQL for Project Alpha.", "PROJECT_DECISION"],
    ["Principle: production changes must be reversible.", "PRINCIPLE"],
    ["Procedure: run tests, build the artifact, then verify it.", "PROCEDURE"],
    ["Correction: use PostgreSQL 18 instead of PostgreSQL 17.", "CORRECTION"],
    ["All deployments require approval except automatic rollback.", "EXCEPTION"],
    ["All persistence services must use PostgreSQL.", "AUTHORITATIVE_RULE"],
  ] as const)("classifies %s as %s", async (content, expected) => {
    const result = await classifier.classify(request(content));

    expect(result.classification).toBe(expected);
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    expect(result.provenance.observationId).toBe("observation-001");
  });

  it("defines semantics for every canonical classification", () => {
    expect(Object.keys(CLASSIFICATION_SEMANTICS).sort()).toEqual(
      [...KNOWLEDGE_CLASSIFICATIONS].sort(),
    );
  });
});

describe("classification guardrails", () => {
  it("keeps conversation non-durable by default", async () => {
    const result = await classifier.classify(request("I think Rust might be interesting someday."));

    expect(result).toMatchObject({
      classification: "CONVERSATION",
      proposedDurability: "NONE",
      persistenceEffect: "NONE",
    });
  });

  it("keeps brainstorming proposed rather than decided", async () => {
    const result = await classifier.classify(request("Let's explore PostgreSQL."));

    expect(result).toMatchObject({
      classification: "BRAINSTORMING",
      status: "PROPOSED",
      proposedDurability: "SESSION",
    });
  });

  it("does not promote a suggestion into a decision", async () => {
    const result = await classifier.classify(request("We could use PostgreSQL."));

    expect(result.classification).toBe("SUGGESTION");
    expect(result.classification).not.toBe("PROJECT_DECISION");
  });

  it("does not promote a preference into a universal rule", async () => {
    const result = await classifier.classify(request("I prefer PostgreSQL."));

    expect(result.classification).toBe("PREFERENCE");
    expect(result.scopeHint).toBe("USER");
    expect(result.classification).not.toBe("AUTHORITATIVE_RULE");
  });

  it("distinguishes a project decision from similarly worded suggestions", async () => {
    const suggestion = await classifier.classify(request("We could use PostgreSQL for Project Alpha."));
    const decision = await classifier.classify(
      request("We decided to use PostgreSQL for Project Alpha."),
    );

    expect(suggestion.classification).toBe("SUGGESTION");
    expect(decision).toMatchObject({
      classification: "PROJECT_DECISION",
      scopeHint: "PROJECT",
      requiresValidation: true,
    });
  });

  it("retains correction supersession hints without applying them", async () => {
    const result = await classifier.classify(
      request("Correction: use PostgreSQL 18 instead of PostgreSQL 17.", {
        relationshipHints: { supersedesKnowledgeIds: ["knowledge-17"] },
      }),
    );

    expect(result.classification).toBe("CORRECTION");
    expect(result.relationshipHints.supersedesKnowledgeIds).toEqual(["knowledge-17"]);
    expect(result.persistenceEffect).toBe("NONE");
  });

  it("retains exception scope and general-rule references", async () => {
    const result = await classifier.classify(
      request("Deployments require approval except automatic rollback.", {
        scopeHint: "PROJECT",
        relationshipHints: { exceptionToKnowledgeIds: ["deployment-approval-rule"] },
      }),
    );

    expect(result).toMatchObject({ classification: "EXCEPTION", scopeHint: "PROJECT" });
    expect(result.relationshipHints.exceptionToKnowledgeIds).toEqual([
      "deployment-approval-rule",
    ]);
  });

  it("distinguishes a potential authoritative rule from an ordinary instruction", async () => {
    const instruction = await classifier.classify(
      request("Use PostgreSQL for this implementation."),
    );
    const rule = await classifier.classify(
      request("All persistence services must use PostgreSQL."),
    );

    expect(instruction.classification).toBe("INSTRUCTION");
    expect(rule).toMatchObject({
      classification: "AUTHORITATIVE_RULE",
      requiresValidation: true,
    });
  });

  it.each(["PostgreSQL.", "", "This seems fine."])(
    "handles ambiguous input conservatively: %j",
    async (content) => {
      const result = await classifier.classify(request(content));

      expect(result.classification).toBeUndefined();
      expect(result).toMatchObject({
        confidence: 0,
        status: "AMBIGUOUS",
        proposedDurability: "NONE",
        requiresValidation: true,
        persistenceEffect: "NONE",
      });
    },
  );

  it("returns concise reasoning metadata rather than hidden reasoning", async () => {
    const result = await classifier.classify(request("We could use PostgreSQL."));

    expect(result.reasoningMetadata).toEqual({
      rationaleCode: "NON_BINDING_PROPOSAL_SIGNAL",
      matchedSignals: ["suggestion-language"],
      classifierId: "phase-0-conservative-information-classifier",
      classifierVersion: "1.0.0",
    });
    expect(JSON.stringify(result.reasoningMetadata).toLowerCase()).not.toContain("chain-of-thought");
  });

  it("never persists information or grants authority and execution permission", async () => {
    const procedure = await classifier.classify(
      request("Procedure: run deploy-prod and verify service health."),
    );

    expect(procedure).toMatchObject({
      classification: "PROCEDURE",
      persistenceEffect: "NONE",
      authorityEffect: "UNCHANGED",
      executionPermissionGranted: false,
    });
  });
});
