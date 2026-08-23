import { describe, expect, it } from "vitest";

import {
  ConservativeKnowledgeScopeResolver,
  createScopeChangeProposal,
  evaluateScopeCompatibility,
  isValidKnowledgeScopeReference,
} from "@/services/learning-constitution";
import {
  KNOWLEDGE_SCOPES,
  type InformationClassificationResult,
  type KnowledgeClassification,
  type KnowledgeScopeReference,
} from "@/types/learning-constitution";

const provenance = {
  observationId: "observation-001",
  sourceId: "interaction-001",
  sourceType: "OPERATOR_STATEMENT" as const,
  originatingActorId: "operator-001",
  observedAt: "2026-08-20T12:00:00.000Z",
};

const classification = (
  value: KnowledgeClassification | undefined = "INSTRUCTION",
  overrides: Partial<InformationClassificationResult> = {},
): InformationClassificationResult => ({
  classification: value,
  confidence: value ? 0.9 : 0,
  status: value ? "CLASSIFIED" : "AMBIGUOUS",
  proposedDurability: value ? "DURABLE_CANDIDATE" : "NONE",
  requiresValidation: true,
  provenance,
  reasoningMetadata: {
    rationaleCode: "TEST_CLASSIFICATION",
    matchedSignals: [],
    classifierId: "test-classifier",
    classifierVersion: "1.0.0",
  },
  relationshipHints: {
    supersedesKnowledgeIds: [],
    exceptionToKnowledgeIds: [],
  },
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
  ...overrides,
});

const identifiedScope = (
  type: Exclude<KnowledgeScopeReference["type"], "SYSTEM" | "GLOBAL">,
  id: string,
  displayName?: string,
): KnowledgeScopeReference => ({ type, id, displayName });

const projectAlpha = identifiedScope("PROJECT", "project-alpha", "Project Alpha");
const projectBeta = identifiedScope("PROJECT", "project-beta", "Project Beta");
const userA = identifiedScope("USER", "user-a", "User A");
const userB = identifiedScope("USER", "user-b", "User B");
const conversation = identifiedScope("CONVERSATION", "conversation-001");
const session = identifiedScope("SESSION", "session-001");

const resolver = new ConservativeKnowledgeScopeResolver();

describe("canonical knowledge scope references", () => {
  it("supports every canonical scope with required identity semantics", () => {
    const references: readonly KnowledgeScopeReference[] = KNOWLEDGE_SCOPES.map((type) =>
      type === "SYSTEM" || type === "GLOBAL"
        ? { type }
        : identifiedScope(type, `${type.toLocaleLowerCase()}-001`),
    );

    expect(references).toHaveLength(KNOWLEDGE_SCOPES.length);
    expect(references.every(isValidKnowledgeScopeReference)).toBe(true);
  });

  it("rejects an identified scope with a missing stable identity", () => {
    const invalid = { type: "PROJECT", id: "" } as KnowledgeScopeReference;

    expect(isValidKnowledgeScopeReference(invalid)).toBe(false);
  });
});

describe("conservative knowledge scope resolution", () => {
  it("resolves an explicitly named project without leaking to another project", async () => {
    const result = await resolver.resolve({
      content: "For Project Alpha, use PostgreSQL.",
      classification: classification(),
      knownScopes: [projectAlpha, projectBeta],
      activeScopes: [projectAlpha],
    });

    expect(result).toMatchObject({
      scope: projectAlpha,
      status: "RESOLVED",
      source: "CONTENT_REFERENCE",
      requiresClarification: false,
    });
    expect(result.scope).not.toEqual(projectBeta);
  });

  it("resolves a user preference only when active user context confirms the hint", async () => {
    const result = await resolver.resolve({
      content: "I prefer concise reports.",
      classification: classification("PREFERENCE", { scopeHint: "USER" }),
      knownScopes: [userA, userB],
      activeScopes: [userA],
    });

    expect(result).toMatchObject({
      scope: userA,
      status: "RESOLVED",
      source: "ACTIVE_CONTEXT",
    });
  });

  it("keeps conversation and session identities distinct", async () => {
    const result = await resolver.resolve({
      content: "During this conversation, call it Atlas.",
      classification: classification("CONVERSATION", { scopeHint: "CONVERSATION" }),
      knownScopes: [conversation, session],
      activeScopes: [conversation, session],
    });

    expect(result.scope).toEqual(conversation);
    expect(evaluateScopeCompatibility(conversation, session).outcome).toBe("INCOMPATIBLE");
  });

  it("does not treat a classifier hint as a resolved scope by itself", async () => {
    const result = await resolver.resolve({
      content: "Use PostgreSQL for this project.",
      classification: classification("INSTRUCTION", { scopeHint: "PROJECT" }),
      knownScopes: [projectAlpha],
      activeScopes: [],
    });

    expect(result.scope).toBeUndefined();
    expect(result).toMatchObject({
      status: "AMBIGUOUS",
      source: "CLASSIFIER_HINT",
      requiresClarification: true,
    });
  });

  it("fails closed on broad always-language instead of inferring Global", async () => {
    const result = await resolver.resolve({
      content: "Always use Redis.",
      classification: classification("INSTRUCTION"),
      knownScopes: [{ type: "GLOBAL" }],
      activeScopes: [projectAlpha],
    });

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.scope).toBeUndefined();
    expect(result.reasoningMetadata.rationaleCode).toBe(
      "BROAD_SCOPE_REQUIRES_JUSTIFICATION",
    );
  });

  it("fails closed when classification is unresolved", async () => {
    const result = await resolver.resolve({
      content: "PostgreSQL.",
      classification: classification(undefined),
      knownScopes: [projectAlpha],
      activeScopes: [projectAlpha],
    });

    expect(result.scope).toBeUndefined();
    expect(result).toMatchObject({
      status: "UNRESOLVED",
      requiresClarification: true,
    });
  });

  it("rejects an invalid explicit scope rather than repairing it", async () => {
    const result = await resolver.resolve({
      content: "Use PostgreSQL.",
      classification: classification(),
      knownScopes: [],
      activeScopes: [],
      explicitScope: { type: "PROJECT", id: "" } as KnowledgeScopeReference,
    });

    expect(result.status).toBe("UNRESOLVED");
    expect(result.reasoningMetadata.rationaleCode).toBe("INVALID_EXPLICIT_SCOPE");
  });

  it("reports multiple named scopes as conflicting instead of choosing one", async () => {
    const result = await resolver.resolve({
      content: "Apply the same database rule to Project Alpha and Project Beta.",
      classification: classification(),
      knownScopes: [projectAlpha, projectBeta],
      activeScopes: [projectAlpha],
    });

    expect(result.status).toBe("CONFLICTING");
    expect(result.reasoningMetadata.matchedScopeIds).toEqual([
      "PROJECT:project-alpha",
      "PROJECT:project-beta",
    ]);
  });

  it("never persists knowledge or changes authority", async () => {
    const result = await resolver.resolve({
      content: "For Project Alpha, use PostgreSQL.",
      classification: classification(),
      knownScopes: [projectAlpha],
      activeScopes: [projectAlpha],
    });

    expect(result).toMatchObject({
      persistenceEffect: "NONE",
      authorityEffect: "UNCHANGED",
      promotionRequested: false,
    });
  });
});

describe("scope compatibility and change proposals", () => {
  it("treats different project scopes as isolated rather than conflicting knowledge", () => {
    expect(evaluateScopeCompatibility(projectAlpha, projectAlpha)).toEqual({
      outcome: "COMPATIBLE",
      reason: "EXACT_SCOPE_MATCH",
    });
    expect(evaluateScopeCompatibility(projectAlpha, projectBeta)).toEqual({
      outcome: "INCOMPATIBLE",
      reason: "SCOPE_IDENTITY_MISMATCH",
    });
  });

  it("isolates different user identities", () => {
    expect(evaluateScopeCompatibility(userA, userB).outcome).toBe("INCOMPATIBLE");
  });

  it("creates promotion proposals without changing knowledge or authority", () => {
    const proposal = createScopeChangeProposal({
      proposalId: "scope-change-001",
      direction: "PROMOTION",
      fromScope: projectAlpha,
      toScope: { type: "GLOBAL" },
      reason: "Observed across projects; requires governance review.",
      provenance,
    });

    expect(proposal).toMatchObject({
      status: "PROPOSED",
      persistenceEffect: "NONE",
      authorityEffect: "UNCHANGED",
    });
  });
});
