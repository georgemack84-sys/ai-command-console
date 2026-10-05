import { describe, expect, it } from "vitest";
import { deriveNuruEmergingInterestHypotheses } from "@/src/server/services/nuru-emerging-interest-service";

describe("Nuru emerging-interest hypotheses", () => {
  it("uses repeated explicit saves and lets a later dismissal withdraw evidence", () => {
    const hypotheses = deriveNuruEmergingInterestHypotheses([{ candidateId: "a", action: "SAVE", candidate: { title: "A", source: { topics: ["space"] } } }, { candidateId: "b", action: "SAVE", candidate: { title: "B", source: { topics: ["space"] } } }]);
    expect(hypotheses[0]).toMatchObject({ topic: "space", evidence: [{ title: "A" }, { title: "B" }] });
    expect(deriveNuruEmergingInterestHypotheses([{ candidateId: "a", action: "DISMISS", candidate: { title: "A", source: { topics: ["space"] } } }, { candidateId: "a", action: "SAVE", candidate: { title: "A", source: { topics: ["space"] } } }, { candidateId: "b", action: "SAVE", candidate: { title: "B", source: { topics: ["space"] } } }])).toEqual([]);
  });
});
