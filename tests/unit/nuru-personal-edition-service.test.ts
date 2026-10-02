import { describe, expect, it } from "vitest";
import { buildNuruPersonalEdition, type NuruEditionCandidate } from "@/src/server/services/nuru-personal-edition-service";

const candidates: NuruEditionCandidate[] = [
  { id: "book-space", title: "Space Book", type: "book", sourceFamily: "Open Library", topics: ["space"], confidence: 0.8, sourceUrl: "https://openlibrary.org/works/1" },
  { id: "film-space", title: "Space Film", type: "documentary", sourceFamily: "TMDB", topics: ["space"], confidence: 0.9, sourceUrl: "https://themoviedb.org/movie/1" },
  { id: "article-space", title: "Space Article", type: "article", sourceFamily: "Library of Congress", topics: ["space"], confidence: 0.7, sourceUrl: "https://blogs.loc.gov/story" },
  { id: "article-history", title: "History Article", type: "article", sourceFamily: "Library of Congress", topics: ["history"], confidence: 0.8, sourceUrl: "https://blogs.loc.gov/history" },
  { id: "book-craft", title: "Craft Book", type: "book", sourceFamily: "Open Library", topics: ["craft"], confidence: 0.9, sourceUrl: "https://openlibrary.org/works/2" },
  { id: "film-nature", title: "Nature Film", type: "documentary", sourceFamily: "TMDB", topics: ["nature"], confidence: 0.9, sourceUrl: "https://themoviedb.org/movie/2" },
  { id: "article-music", title: "Music Article", type: "article", sourceFamily: "Library of Congress", topics: ["music"], confidence: 0.8, sourceUrl: "https://blogs.loc.gov/music" },
];

describe("Nuru personal edition", () => {
  it("is deterministic, excludes negative topics, and keeps source facts visible", () => {
    const taste = { preferredTopics: ["space"], excludedTopics: ["music"], explorationTolerance: 0.7 };
    const first = buildNuruPersonalEdition(candidates, taste); const second = buildNuruPersonalEdition(candidates, taste);
    expect(first).toEqual(second); expect(first.map((item) => item.candidate.id)).not.toContain("article-music"); expect(first[0]).toMatchObject({ lane: "FAMILIAR", explanation: expect.stringContaining("space") });
  });

  it("changes the leading discovery for a meaningfully different Taste Map", () => {
    expect(buildNuruPersonalEdition(candidates, { preferredTopics: ["space"] })[0]?.candidate.id).toBe("film-space");
    expect(buildNuruPersonalEdition(candidates, { preferredTopics: ["craft"] })[0]?.candidate.id).toBe("book-craft");
  });

  it("gives synthetic personas materially different editions from one broad pool", () => {
    const broadPool: NuruEditionCandidate[] = ["space", "craft", "history"].flatMap((topic) => [1, 2, 3, 4].map((number) => ({ id: `${topic}-${number}`, title: `${topic} ${number}`, type: number === 1 ? "book" as const : number === 2 ? "documentary" as const : "article" as const, sourceFamily: `${topic}-${number}.example`, topics: [topic], confidence: 0.9, sourceUrl: `https://${topic}-${number}.example/item` })));
    const spaceEdition = buildNuruPersonalEdition(broadPool, { preferredTopics: ["space"] });
    const craftEdition = buildNuruPersonalEdition(broadPool, { preferredTopics: ["craft"] });
    const shared = new Set(craftEdition.map((item) => item.candidate.id));
    const different = spaceEdition.filter((item) => !shared.has(item.candidate.id));
    expect(spaceEdition[0]?.candidate.id).toBe("space-1");
    expect(craftEdition[0]?.candidate.id).toBe("craft-1");
    expect(different.length).toBeGreaterThanOrEqual(3);
  });

  it("uses three source families and two formats whenever the eligible pool supplies them", () => {
    const unevenPool: NuruEditionCandidate[] = [
      ...[1, 2, 3, 4, 5].map((number) => ({ id: `dominant-${number}`, title: `Dominant ${number}`, type: "book" as const, sourceFamily: "dominant.example", topics: ["space"], confidence: 1, sourceUrl: `https://dominant.example/${number}` })),
      { id: "documentary", title: "Documentary", type: "documentary", sourceFamily: "film.example", topics: ["space"], confidence: 0.1, sourceUrl: "https://film.example/1" },
      { id: "article", title: "Article", type: "article", sourceFamily: "journal.example", topics: ["space"], confidence: 0.1, sourceUrl: "https://journal.example/1" },
    ];

    const edition = buildNuruPersonalEdition(unevenPool, { preferredTopics: ["space"] });
    expect(new Set(edition.map((item) => item.candidate.sourceFamily)).size).toBeGreaterThanOrEqual(3);
    expect(new Set(edition.map((item) => item.candidate.type)).size).toBeGreaterThanOrEqual(2);
  });
});
