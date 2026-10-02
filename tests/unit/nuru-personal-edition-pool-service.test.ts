import { describe, expect, it } from "vitest";
import { excludeRecentlyShownCandidates, nuruEditionDate, toNuruEditionCandidate } from "@/src/server/services/nuru-personal-edition-pool-service";
import { dismissedNuruEditionCandidateIds } from "@/src/server/services/nuru-personal-edition-feedback-service";

describe("Nuru personal edition pool", () => {
  it("maps only eligible, source-backed R2 material into the edition contract", () => {
    expect(toNuruEditionCandidate({ id: "c1", title: "Space", content: "", source: { uri: "https://openlibrary.org/work/1", topics: ["space"] }, reasonDiscovered: "Retrieved", initialType: "book", confidence: 0.7 })).toMatchObject({ type: "book", sourceFamily: "openlibrary.org", topics: ["space"] });
    expect(toNuruEditionCandidate({ id: "c2", title: "Bad", content: "", source: {}, reasonDiscovered: "Retrieved", initialType: "book", confidence: 0.7 })).toBeNull();
  });

  it("uses a stable UTC day and excludes recently shown candidates before ranking", () => {
    expect(nuruEditionDate(new Date("2026-09-17T23:59:59.000Z")).toISOString()).toBe("2026-09-17T00:00:00.000Z");
    const candidate = toNuruEditionCandidate({ id: "c1", title: "Space", content: "", source: { uri: "https://openlibrary.org/work/1", topics: ["space"] }, reasonDiscovered: "Retrieved", initialType: "book", confidence: 0.7 });
    expect(excludeRecentlyShownCandidates([candidate!], ["c1"])).toEqual([]);
  });

  it("uses the member’s timezone to choose the edition day", () => {
    expect(nuruEditionDate(new Date("2026-09-17T02:30:00.000Z"), "America/New_York").toISOString()).toBe("2026-09-16T00:00:00.000Z");
  });

  it("keeps a dismissed candidate out until an explicit restore is the latest action", () => {
    expect(dismissedNuruEditionCandidateIds([{ candidateId: "c1", action: "RESTORE" }, { candidateId: "c1", action: "DISMISS" }, { candidateId: "c2", action: "DISMISS" }])).toEqual(new Set(["c2"]));
  });
});
