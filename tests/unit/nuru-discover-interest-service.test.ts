import { describe, expect, it } from "vitest";
import { deriveNuruFeedbackTasteSignals, nuruDiscoverInterestSignalSchema, resolveNuruDiscoverInterestState } from "@/src/server/services/nuru-discover-interest-service";

describe("Nuru Discover interest signals", () => {
  it("uses the latest append-only signal for each catalog item", () => {
    const state = resolveNuruDiscoverInterestState([
      { knowledgeItemId: "K-1", signalType: "SAVE", weight: 1, source: "DISCOVER_UI", reasonCode: null, createdAt: new Date("2026-09-15T10:00:00.000Z") },
      { knowledgeItemId: "K-2", signalType: "SAVE", weight: 1, source: "DISCOVER_UI", reasonCode: null, createdAt: new Date("2026-09-15T10:00:00.000Z") },
      { knowledgeItemId: "K-1", signalType: "DISMISS", weight: -1, source: "DISCOVER_UI", reasonCode: null, createdAt: new Date("2026-09-15T11:00:00.000Z") },
    ]);
    expect(state).toEqual({ savedItemIds: ["K-2"], dismissedItemIds: ["K-1"] });
  });

  it("accepts only feedback reasons that match the reaction", () => {
    expect(nuruDiscoverInterestSignalSchema.parse({ knowledgeItemId: "K-1", signalType: "SAVE", reasonCode: "PROCESS" })).toEqual({ knowledgeItemId: "K-1", signalType: "SAVE", reasonCode: "PROCESS" });
    expect(() => nuruDiscoverInterestSignalSchema.parse({ knowledgeItemId: "K-1", signalType: "DISMISS", reasonCode: "PROCESS" })).toThrow();
  });

  it("updates only the relevant taste dimension for a structured reaction", () => {
    expect(deriveNuruFeedbackTasteSignals({ knowledgeItemId: "K-1", signalType: "DISMISS", reasonCode: "TOO_TECHNICAL" }, { topics: ["aviation"], contentType: "Documentary" })).toEqual([expect.objectContaining({ concept: "Technical detail", dimension: "DEPTH", polarity: -1 })]);
    expect(deriveNuruFeedbackTasteSignals({ knowledgeItemId: "K-1", signalType: "SAVE", reasonCode: "PROCESS" }, { topics: ["aviation"], contentType: "Documentary" })).toEqual([expect.objectContaining({ concept: "Process", dimension: "ATTENTION_LENS", polarity: 1 })]);
  });
});
