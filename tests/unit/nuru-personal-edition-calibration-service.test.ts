import { describe, expect, it } from "vitest";
import { calibrateNuruPersonalEdition } from "@/src/server/services/nuru-personal-edition-calibration-service";
import { buildNuruPersonalEdition, type NuruEditionCandidate } from "@/src/server/services/nuru-personal-edition-service";

const candidates: NuruEditionCandidate[] = [
  { id: "book", title: "Sky Atlas", type: "book", sourceFamily: "Open Library", topics: ["space"], confidence: 0.8, sourceUrl: "https://openlibrary.org/works/1" },
  { id: "film", title: "Deep Field", type: "documentary", sourceFamily: "TMDB", topics: ["space"], confidence: 0.9, sourceUrl: "https://themoviedb.org/movie/1" },
  { id: "article", title: "Archive Signals", type: "article", sourceFamily: "Library of Congress", topics: ["history"], confidence: 0.8, sourceUrl: "https://blogs.loc.gov/history" },
  { id: "craft", title: "Made by Hand", type: "book", sourceFamily: "Open Library", topics: ["craft"], confidence: 0.7, sourceUrl: "https://openlibrary.org/works/2" },
];

describe("Nuru personal edition calibration", () => {
  it("passes a grounded, finite edition with meaningful range", () => {
    const report = calibrateNuruPersonalEdition(buildNuruPersonalEdition(candidates, { preferredTopics: ["space"], explorationTolerance: 0.8 }));
    expect(report).toMatchObject({ sourceDiversity: 3, formatDiversity: 3, groundedExplanationRate: 1, sourceLinkRate: 1, antiBubble: "PASS" });
  });

  it("calls out a narrow fixture instead of treating it as personalized quality", () => {
    const narrow = buildNuruPersonalEdition(candidates.filter((candidate) => candidate.id !== "film" && candidate.id !== "article"), { preferredTopics: ["space"] });
    expect(calibrateNuruPersonalEdition(narrow)).toMatchObject({ antiBubble: "NEEDS_MORE_RANGE" });
  });

  it("fails an otherwise varied fixture when provenance is not available to the user", () => {
    const edition = buildNuruPersonalEdition(candidates, { preferredTopics: ["space"], explorationTolerance: 0.8 });
    edition[0].candidate.sourceUrl = "";
    const report = calibrateNuruPersonalEdition(edition);
    expect(report).toMatchObject({ sourceLinkRate: expect.any(Number) });
    expect(report.sourceLinkRate).toBeLessThan(1);
    expect(report.checks.find((check) => check.name === "source_links")?.passed).toBe(false);
  });
});
