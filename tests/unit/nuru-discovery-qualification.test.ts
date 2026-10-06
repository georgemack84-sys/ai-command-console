import { describe, expect, it } from "vitest";
import { qualifyNuruDiscoveryBatch, type NuruExternalCandidate } from "@/src/server/services/nuru-discovery-source-service";

const now = new Date("2026-10-06T12:00:00.000Z");
function candidate(overrides: Partial<NuruExternalCandidate> = {}): NuruExternalCandidate {
  return { sourceId: "open-library", externalId: "OL-1", type: "book", title: "Controlled Discovery", creator: null, summary: "A sufficiently detailed controlled discovery fixture.", topics: ["qualification"], sourceUrl: "https://openlibrary.org/works/OL-1", publishedAt: null, retrievedAt: now.toISOString(), sourceAuthority: "MODERATE", ...overrides };
}

describe("NRQ-11 discovery qualification", () => {
  it("keeps qualifying material as attributable candidates, never canonical knowledge", () => {
    const result = qualifyNuruDiscoveryBatch([candidate()], now);
    expect(result.accepted).toHaveLength(1);
    expect(result.accepted[0]).toMatchObject({ externalKey: "open-library:OL-1", candidate: { sourceUrl: "https://openlibrary.org/works/OL-1" } });
    expect(Object.keys(result.accepted[0])).not.toContain("canonicalRecord");
  });

  it("rejects stale, off-policy, and duplicate-in-run candidates while preserving their diagnostics", () => {
    const result = qualifyNuruDiscoveryBatch([
      candidate(),
      candidate(),
      candidate({ externalId: "OL-stale", retrievedAt: "2026-10-04T12:00:00.000Z" }),
      candidate({ externalId: "OL-off-policy", sourceUrl: "https://untrusted.example/record" }),
    ], now);
    expect(result.accepted).toHaveLength(1);
    expect(result.rejected.map((entry) => entry.reason)).toEqual(["DUPLICATE_IN_RUN", "STALE_RETRIEVAL", "SOURCE_URL_OUTSIDE_POLICY"]);
  });

  it("keeps independently sourced title conflicts separate and routes them to review", () => {
    const result = qualifyNuruDiscoveryBatch([
      candidate(),
      candidate({ sourceId: "tmdb", externalId: "42", type: "documentary", sourceUrl: "https://www.themoviedb.org/movie/42", title: "Other work" }),
      candidate({ sourceId: "open-library", externalId: "OL-2", title: "Controlled Discovery", sourceUrl: "https://openlibrary.org/works/OL-2" }),
    ], now);
    expect(result.accepted).toHaveLength(3);
    expect([...result.conflictedExternalKeys]).toEqual(["open-library:OL-1", "open-library:OL-2"]);
  });

  it("is deterministic across an incremental rerun with the same external key", () => {
    const first = qualifyNuruDiscoveryBatch([candidate()], now);
    const rerun = qualifyNuruDiscoveryBatch([candidate()], now);
    expect(rerun.accepted[0].externalKey).toBe(first.accepted[0].externalKey);
    expect(rerun.rejected).toEqual([]);
  });
});
