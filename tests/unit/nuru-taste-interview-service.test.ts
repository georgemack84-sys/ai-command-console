import { describe, expect, it } from "vitest";
import { deriveNuruInterviewSignals, nuruTasteInterviewInputSchema } from "@/src/server/services/nuru-taste-interview-service";

const interview = { answers: [
  { promptId: "recent-fascinations", answer: "Early aviation, industrial espionage, and ocean mapping" },
  { promptId: "why-it-matters", answer: "I like the hidden systems behind important decisions." },
  { promptId: "not-for-you", answer: "Celebrity news" },
  { promptId: "depth-or-newness", answer: "A little of both, with a bias toward surprising new territory." },
  { promptId: "attention-lens", answer: "The process and the people involved." },
] };

describe("Nuru Taste Interview", () => {
  it("keeps answers as bounded evidence and derives only tentative signals", () => {
    const signals = deriveNuruInterviewSignals(nuruTasteInterviewInputSchema.parse(interview));
    expect(signals).toEqual(expect.arrayContaining([expect.objectContaining({ concept: "Early aviation", dimension: "SUBJECT", polarity: 1, confidence: 0.35 }), expect.objectContaining({ concept: "Celebrity news", dimension: "NEGATIVE_SUBJECT", polarity: -1 }), expect.objectContaining({ dimension: "EXPLORATION", confidence: 0.25 })]));
    expect(signals.every((signal) => signal.confidence < 0.4)).toBe(true);
  });
  it("requires every interview prompt and rejects blank answers", () => {
    expect(() => nuruTasteInterviewInputSchema.parse({ answers: interview.answers.slice(0, 4) })).toThrow();
    expect(() => nuruTasteInterviewInputSchema.parse({ answers: interview.answers.map((answer, index) => index === 0 ? { ...answer, answer: "" } : answer) })).toThrow();
    expect(() => nuruTasteInterviewInputSchema.parse({ answers: interview.answers.map((answer, index) => index === 4 ? { ...answer, promptId: "recent-fascinations" } : answer) })).toThrow("exactly once");
  });
});
