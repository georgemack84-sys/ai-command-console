import { describe, expect, it } from "vitest";

import { classifyCanonicalInputWithContextConservatively } from "@/services/learning-constitution";
import type { ClassificationContextFrame } from "@/types/learning-constitution";

const source = { observationId: "observation-1", sourceId: "message-1", sourceType: "CONVERSATION" as const, originatingActorId: "operator-1", observedAt: "2026-08-21T00:00:00.000Z" };
const request = (content: string, contextFrames: readonly ClassificationContextFrame[] = []) => ({ source, content, contextFrames, maximumContextFrames: 1 });
const brainstormingFrame = { frameId: "brainstorm", source: "IMMEDIATE_CONVERSATION" as const, sourceId: "previous-message", modes: ["BRAINSTORM_CONTEXT" as const], content: "Let's brainstorm storage options." };

describe("bounded contextual classification pipeline", () => {
  it("classifies an otherwise unresolved unit as an idea only in declared brainstorming context", () => {
    const withoutContext = classifyCanonicalInputWithContextConservatively(request("PostgreSQL."));
    expect(withoutContext.classification.classifications[0]).toMatchObject({ status: "REQUIRES_REVIEW" });
    const withContext = classifyCanonicalInputWithContextConservatively(request("PostgreSQL.", [brainstormingFrame]));
    expect(withContext.classification.classifications[0]).toMatchObject({ category: "IDEA", status: "CLASSIFIED", reasonCodes: expect.arrayContaining(["INHERITED_BRAINSTORM_CONTEXT"]) });
  });

  it("lets an explicit current decision exit inherited brainstorming instead of downgrading it", () => {
    const result = classifyCanonicalInputWithContextConservatively(request("We decided to use PostgreSQL.", [brainstormingFrame]));
    expect(result.context.activeModes).toEqual(["DECISION_CONTEXT"]);
    expect(result.classification.classifications[0]).toMatchObject({ category: "DECISION", status: "CLASSIFIED" });
  });

  it("preserves the non-effect boundary", () => {
    expect(classifyCanonicalInputWithContextConservatively(request("PostgreSQL.", [brainstormingFrame]))).toMatchObject({
      persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
    });
  });
});
