import { describe, expect, it } from "vitest";
import { calibrateNuruPersonalEdition } from "@/src/server/services/nuru-personal-edition-calibration-service";
import { deriveNuruPersonalEditionTasteSignals } from "@/src/server/services/nuru-personal-edition-feedback-service";
import { buildNuruPersonalEdition, type NuruEditionCandidate } from "@/src/server/services/nuru-personal-edition-service";
import { buildNuruTasteRetrievalPlan } from "@/src/server/services/nuru-discovery-source-service";
import { deriveNuruInterviewSignals, nuruTasteInterviewInputSchema } from "@/src/server/services/nuru-taste-interview-service";

const candidates: NuruEditionCandidate[] = [
  { id: "aviation-book", title: "Aviation Atlas", type: "book", sourceFamily: "openlibrary.org", topics: ["early aviation"], confidence: 0.5, sourceUrl: "https://openlibrary.org/works/aviation" },
  { id: "ocean-film", title: "Mapping the Deep", type: "documentary", sourceFamily: "themoviedb.org", topics: ["ocean mapping"], confidence: 0.7, sourceUrl: "https://themoviedb.org/movie/ocean" },
  { id: "systems-article", title: "Hidden Systems", type: "article", sourceFamily: "museum.example", topics: ["systems", "early aviation"], confidence: 0.6, sourceUrl: "https://museum.example/systems" },
  { id: "history-book", title: "Making History", type: "book", sourceFamily: "library.example", topics: ["history", "early aviation"], confidence: 0.55, sourceUrl: "https://library.example/history" },
  { id: "ecology-film", title: "Living Coasts", type: "documentary", sourceFamily: "film.example", topics: ["ecology"], confidence: 0.66, sourceUrl: "https://film.example/coasts" },
  { id: "craft-article", title: "The Art of Repair", type: "article", sourceFamily: "journal.example", topics: ["craft"], confidence: 0.64, sourceUrl: "https://journal.example/repair" },
  { id: "people-article", title: "People Who Built the Map", type: "article", sourceFamily: "archive.example", topics: ["people", "ocean mapping"], confidence: 0.62, sourceUrl: "https://archive.example/maps" },
];

describe("Nuru personal-discovery release qualification", () => {
  it("carries a user from tentative interview evidence through a diverse edition and a visible feedback update", () => {
    const interviewSignals = deriveNuruInterviewSignals(nuruTasteInterviewInputSchema.parse({ answers: [
      { promptId: "recent-fascinations", answer: "Early aviation, industrial systems, and forgotten maps" },
      { promptId: "why-it-matters", answer: "I like the process behind consequential decisions." },
      { promptId: "not-for-you", answer: "Celebrity news" },
      { promptId: "depth-or-newness", answer: "I enjoy surprising new territory." },
      { promptId: "attention-lens", answer: "The process matters most." },
    ] }));
    expect(interviewSignals.every((signal) => signal.confidence < 0.4)).toBe(true);
    expect(buildNuruTasteRetrievalPlan(interviewSignals)).toContain("Early aviation");

    const firstEdition = buildNuruPersonalEdition(candidates, { preferredTopics: ["early aviation"], excludedTopics: ["celebrity news"], explorationTolerance: 0.8 });
    expect(firstEdition).toEqual(buildNuruPersonalEdition(candidates, { preferredTopics: ["early aviation"], excludedTopics: ["celebrity news"], explorationTolerance: 0.8 }));
    expect(firstEdition[0]?.candidate.id).not.toBe("ocean-film");
    expect(firstEdition.every((item) => item.candidate.sourceUrl.startsWith("https://") && item.explanation.length > 0)).toBe(true);
    expect(calibrateNuruPersonalEdition(firstEdition)).toMatchObject({ sourceDiversity: expect.any(Number), formatDiversity: expect.any(Number), groundedExplanationRate: 1, sourceLinkRate: 1, antiBubble: "PASS" });

    const feedbackSignals = deriveNuruPersonalEditionTasteSignals({ candidateId: "ocean-film", action: "SAVE", reasonCode: "SUBJECT" }, { id: "ocean-film", initialType: "documentary", source: { topics: ["ocean mapping"] } });
    expect(feedbackSignals).toEqual([expect.objectContaining({ concept: "ocean mapping", dimension: "SUBJECT", polarity: 1 })]);
    expect(feedbackSignals).toHaveLength(1);

    const updatedEdition = buildNuruPersonalEdition(candidates, { preferredTopics: ["early aviation", "ocean mapping"], excludedTopics: ["celebrity news"], explorationTolerance: 0.8 });
    expect(updatedEdition[0]?.candidate.id).toBe("ocean-film");
    expect(new Set(updatedEdition.map((item) => item.candidate.sourceFamily)).size).toBeGreaterThanOrEqual(3);
    expect(new Set(updatedEdition.map((item) => item.candidate.type)).size).toBeGreaterThanOrEqual(2);
  });
});
