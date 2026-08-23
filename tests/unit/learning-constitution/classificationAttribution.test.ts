import { describe, expect, it } from "vitest";

import {
  classifyCanonicalInputWithContextConservatively,
  resolveClassificationAttribution,
} from "@/services/learning-constitution";

const provenance = (sourceType: "OPERATOR_STATEMENT" | "AGENT_OUTPUT" | "EXTERNAL_SOURCE") => ({ observationId: "observation-1", sourceId: "source-1", sourceType, originatingActorId: `${sourceType}-actor`, observedAt: "2026-08-21T00:00:00.000Z" });

describe("classification attribution", () => {
  it("preserves speaker attribution without supplying reliability, truth, or authority", () => {
    expect(resolveClassificationAttribution(provenance("OPERATOR_STATEMENT"))).toMatchObject({ speakerType: "USER", sourceReliabilityStatus: "NOT_EVALUATED", truthValidationStatus: "NOT_EVALUATED", authorityEffect: "UNCHANGED" });
    expect(resolveClassificationAttribution(provenance("AGENT_OUTPUT"))).toMatchObject({ speakerType: "AGENT" });
    expect(resolveClassificationAttribution(provenance("EXTERNAL_SOURCE"))).toMatchObject({ speakerType: "EXTERNAL_SOURCE" });
  });

  it("marks contextual classification as inferred while preserving a source-neutral result", () => {
    const result = classifyCanonicalInputWithContextConservatively({ source: provenance("AGENT_OUTPUT"), content: "PostgreSQL.", maximumContextFrames: 1,
      contextFrames: [{ frameId: "brainstorm", source: "IMMEDIATE_CONVERSATION", sourceId: "previous", modes: ["BRAINSTORM_CONTEXT"], content: "Let's brainstorm storage." }],
    });
    expect(result.classification.classifications[0]).toMatchObject({ category: "IDEA", classificationBasis: "INFERRED" });
    expect(result.attribution).toMatchObject({ speakerType: "AGENT", authorityEffect: "UNCHANGED" });
  });
});
