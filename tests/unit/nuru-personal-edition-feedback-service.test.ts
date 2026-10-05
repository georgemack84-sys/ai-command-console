import { describe, expect, it } from "vitest";
import { deriveNuruPersonalEditionTasteSignals, nuruPersonalEditionFeedbackSchema } from "@/src/server/services/nuru-personal-edition-feedback-service";

describe("Nuru personal-edition feedback", () => {
  it("accepts structured reasons that match the member's reaction", () => {
    expect(nuruPersonalEditionFeedbackSchema.parse({ candidateId: "candidate-1", action: "SAVE", reasonCode: "PROCESS" })).toMatchObject({ action: "SAVE", reasonCode: "PROCESS" });
    expect(nuruPersonalEditionFeedbackSchema.parse({ candidateId: "candidate-1", action: "DISMISS", reasonCode: "WRONG_FORMAT" })).toMatchObject({ action: "DISMISS", reasonCode: "WRONG_FORMAT" });
  });

  it("rejects a reason that does not match the reaction", () => {
    expect(() => nuruPersonalEditionFeedbackSchema.parse({ candidateId: "candidate-1", action: "SAVE", reasonCode: "TOO_SIMILAR" })).toThrow("matches saving");
    expect(() => nuruPersonalEditionFeedbackSchema.parse({ candidateId: "candidate-1", action: "RESTORE", reasonCode: "SUBJECT" })).toThrow("does not need");
  });

  it("derives tentative Taste Map evidence from a structured reason", () => {
    const candidate = { id: "candidate-1", initialType: "documentary", source: { topics: ["aviation"] } };
    expect(deriveNuruPersonalEditionTasteSignals({ candidateId: candidate.id, action: "SAVE", reasonCode: "SUBJECT" }, candidate)).toEqual([expect.objectContaining({ concept: "aviation", dimension: "SUBJECT", polarity: 1 })]);
    expect(deriveNuruPersonalEditionTasteSignals({ candidateId: candidate.id, action: "DISMISS", reasonCode: "WRONG_FORMAT" }, candidate)).toEqual([expect.objectContaining({ concept: "documentary", dimension: "FORMAT", polarity: -1 })]);
    expect(deriveNuruPersonalEditionTasteSignals({ candidateId: candidate.id, action: "RESTORE" }, candidate)).toEqual([]);
  });
});
