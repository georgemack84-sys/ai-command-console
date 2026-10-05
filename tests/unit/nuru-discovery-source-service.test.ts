import { afterEach, describe, expect, it, vi } from "vitest";
import { assessNuruExternalCandidate, buildNuruTasteRetrievalPlan, evaluateNuruAutonomousPoolReleaseGate, getNuruDiscoverySourceReadiness, nuruDiscoverySourceRegistry, retrieveAllowlistedRss, retrieveOpenLibrary, retrieveTmdb, summarizeNuruDiscoverySourceHealth, summarizeNuruDiscoverySourceOperations } from "@/src/server/services/nuru-discovery-source-service";

const priorContact = process.env.NURU_SOURCE_CONTACT;
const priorToken = process.env.TMDB_ACCESS_TOKEN;
const priorRssUrls = process.env.NURU_DISCOVERY_RSS_URLS;
afterEach(() => { if (priorContact === undefined) delete process.env.NURU_SOURCE_CONTACT; else process.env.NURU_SOURCE_CONTACT = priorContact; if (priorToken === undefined) delete process.env.TMDB_ACCESS_TOKEN; else process.env.TMDB_ACCESS_TOKEN = priorToken; if (priorRssUrls === undefined) delete process.env.NURU_DISCOVERY_RSS_URLS; else process.env.NURU_DISCOVERY_RSS_URLS = priorRssUrls; });

describe("Nuru discovery sources", () => {
  it("normalizes Open Library results and identifies its low-volume request", async () => {
    process.env.NURU_SOURCE_CONTACT = "nuru@example.test";
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ docs: [{ key: "/works/OL1W", title: "Invisible Systems", author_name: ["Ada Example"], first_publish_year: 2020, subject: ["systems"] }] }), { status: 200 }));
    const [candidate] = await retrieveOpenLibrary("systems", 3, fetcher);
    expect(candidate).toMatchObject({ type: "book", title: "Invisible Systems", creator: "Ada Example", sourceUrl: "https://openlibrary.org/works/OL1W", topics: ["systems"] });
    expect(fetcher.mock.calls[0][1].headers["User-Agent"]).toContain("nuru@example.test");
  });

  it("retains the Taste Map retrieval query when catalog subjects use different vocabulary", async () => {
    process.env.NURU_SOURCE_CONTACT = "nuru@example.test";
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ docs: [{ key: "/works/OL2W", title: "Deep Current", subject: ["oceanography"] }] }), { status: 200 }));
    const [candidate] = await retrieveOpenLibrary("deep ocean mapping", 3, fetcher);
    expect(candidate.topics).toEqual(expect.arrayContaining(["deep ocean mapping", "oceanography"]));
  });

  it("fails closed when a required source credential is absent", async () => {
    delete process.env.TMDB_ACCESS_TOKEN;
    await expect(retrieveTmdb("aviation", 3, vi.fn())).rejects.toThrow("TMDB_ACCESS_TOKEN");
  });

  it("only labels TMDB results as documentaries when TMDB classifies them that way", async () => {
    process.env.TMDB_ACCESS_TOKEN = "test-token";
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [{ id: 1, title: "A feature film", genre_ids: [12] }, { id: 2, title: "A documentary", genre_ids: [99] }] }), { status: 200 }));
    await expect(retrieveTmdb("space", 3, fetcher)).resolves.toMatchObject([{ externalId: "2", title: "A documentary", type: "documentary" }]);
  });

  it("matches relevant RSS terms without requiring the exact original phrase", async () => {
    process.env.NURU_DISCOVERY_RSS_URLS = "https://publisher.example/feed.xml";
    const feed = "<?xml version=\"1.0\"?><rss version=\"2.0\"><channel><title>Publisher</title><link>https://publisher.example</link><description>Reports</description><item><guid>one</guid><title>Exploring space with new instruments</title><link>https://publisher.example/story</link><description>A long-form report.</description></item></channel></rss>";
    await expect(retrieveAllowlistedRss("space exploration", 3, vi.fn().mockResolvedValue(new Response(feed, { status: 200 })))).resolves.toMatchObject([{ type: "article", title: "Exploring space with new instruments" }]);
  });

  it("does not report an all-failed RSS allowlist as a successful empty retrieval", async () => {
    process.env.NURU_DISCOVERY_RSS_URLS = "https://publisher.example/feed.xml";
    await expect(retrieveAllowlistedRss("space", 3, vi.fn().mockResolvedValue(new Response("blocked", { status: 403 })))).rejects.toThrow("No allowlisted RSS feed responded successfully");
  });

  it("reports missing source setup without exposing values", () => {
    delete process.env.NURU_SOURCE_CONTACT;
    delete process.env.TMDB_ACCESS_TOKEN;
    delete process.env.NURU_DISCOVERY_RSS_URLS;
    expect(getNuruDiscoverySourceReadiness()).toMatchObject({ policyVersion: "nuru-source-policy-v1", sources: [{ sourceId: "open-library", ready: false }, { sourceId: "tmdb", ready: false }, { sourceId: "allowlisted-rss", ready: false, configuredFeedCount: 0 }] });
    process.env.NURU_SOURCE_CONTACT = "operations@example.test";
    process.env.TMDB_ACCESS_TOKEN = "private-token";
    process.env.NURU_DISCOVERY_RSS_URLS = "https://publisher.example/feed.xml";
    expect(getNuruDiscoverySourceReadiness()).toMatchObject({ sources: [{ sourceId: "open-library", ready: true, missingConfiguration: null }, { sourceId: "tmdb", ready: true, missingConfiguration: null }, { sourceId: "allowlisted-rss", ready: true, configuredFeedCount: 1 }] });
    expect(JSON.stringify(getNuruDiscoverySourceReadiness())).not.toContain("private-token");
  });

  it("reports source failure and stale retrieval without exposing raw upstream errors", () => {
    const now = new Date("2026-09-17T12:00:00.000Z");
    const health = summarizeNuruDiscoverySourceHealth([
      { sourceId: "open-library", status: "COMPLETED", candidateCount: 4, startedAt: new Date("2026-09-17T11:00:00.000Z"), completedAt: new Date("2026-09-17T11:00:05.000Z") },
      { sourceId: "tmdb", status: "FAILED", candidateCount: 0, startedAt: new Date("2026-09-17T11:30:00.000Z"), completedAt: new Date("2026-09-17T11:30:03.000Z") },
      { sourceId: "allowlisted-rss", status: "COMPLETED", candidateCount: 2, startedAt: new Date("2026-09-15T11:00:00.000Z"), completedAt: new Date("2026-09-15T11:00:05.000Z") },
    ], now);
    expect(health).toEqual([
      { sourceId: "open-library", state: "HEALTHY", lastRetrievedAt: "2026-09-17T11:00:05.000Z", candidateCount: 4 },
      { sourceId: "tmdb", state: "DEGRADED", lastRetrievedAt: "2026-09-17T11:30:03.000Z", candidateCount: 0 },
      { sourceId: "allowlisted-rss", state: "STALE", lastRetrievedAt: "2026-09-15T11:00:05.000Z", candidateCount: 2 },
    ]);
  });

  it("reports source cost-and-reliability inputs without using them for personalization", () => {
    const operations = summarizeNuruDiscoverySourceOperations([
      { sourceId: "open-library", status: "COMPLETED", candidateCount: 4, startedAt: new Date("2026-09-17T11:00:00.000Z"), completedAt: new Date("2026-09-17T11:00:02.000Z") },
      { sourceId: "open-library", status: "FAILED", candidateCount: 0, startedAt: new Date("2026-09-17T12:00:00.000Z"), completedAt: new Date("2026-09-17T12:00:01.000Z") },
    ]);
    expect(operations).toContainEqual({ sourceId: "open-library", attempts: 2, completed: 1, failureRate: 0.5, averageLatencyMs: 2000, candidatesRetrieved: 4 });
    expect(operations).toContainEqual({ sourceId: "tmdb", attempts: 0, completed: 0, failureRate: null, averageLatencyMs: null, candidatesRetrieved: 0 });
  });

  it("holds the autonomous pool release until every configured source passes a fresh live run", () => {
    const ids = ["open-library", "tmdb", "allowlisted-rss"] as const;
    const ready = ids.map((sourceId) => ({ sourceId, ready: true }));
    expect(evaluateNuruAutonomousPoolReleaseGate(ready, ids.map((sourceId) => ({ sourceId, state: "HEALTHY" as const })), { "open-library": 1, tmdb: 1, "allowlisted-rss": 1 })).toEqual({ release: "R2_AUTONOMOUS_POOL", passed: true, blockers: [] });
    expect(evaluateNuruAutonomousPoolReleaseGate([{ sourceId: "open-library", ready: true }, { sourceId: "tmdb", ready: false }, { sourceId: "allowlisted-rss", ready: true }], [{ sourceId: "open-library", state: "HEALTHY" }, { sourceId: "tmdb", state: "NOT_YET_RUN" }, { sourceId: "allowlisted-rss", state: "STALE" }], { "open-library": 1 })).toEqual({ release: "R2_AUTONOMOUS_POOL", passed: false, blockers: [{ sourceId: "tmdb", code: "CONFIGURATION_MISSING" }, { sourceId: "allowlisted-rss", code: "LIVE_RETRIEVAL_UNVERIFIED" }] });
    expect(evaluateNuruAutonomousPoolReleaseGate(ready, ids.map((sourceId) => ({ sourceId, state: "HEALTHY" as const })), { "open-library": 1, tmdb: 1 })).toMatchObject({ passed: false, blockers: [{ sourceId: "allowlisted-rss", code: "CANDIDATE_COVERAGE_MISSING" }] });
  });

  it("plans bounded retrieval from positive Taste Map evidence and rejects off-policy URLs", () => {
    expect(nuruDiscoverySourceRegistry["open-library"]).toMatchObject({ eligibleTypes: ["book"], allowedDomains: ["openlibrary.org"] });
    expect(buildNuruTasteRetrievalPlan([{ concept: "Aviation", dimension: "SUBJECT", polarity: 1, confidence: 0.6 }, { concept: "Aviation", dimension: "SUBJECT", polarity: 1, confidence: 0.2 }, { concept: "Celebrity", dimension: "NEGATIVE_SUBJECT", polarity: -1, confidence: 0.9 }])).toEqual(["Aviation"]);
    expect(assessNuruExternalCandidate({ sourceId: "open-library", externalId: "x", type: "book", title: "A title", creator: null, summary: "A sufficiently descriptive summary.", topics: [], sourceUrl: "https://untrusted.example/x", publishedAt: null, retrievedAt: new Date().toISOString(), sourceAuthority: "MODERATE" })).toEqual({ accepted: false, reason: "SOURCE_URL_OUTSIDE_POLICY" });
    expect(assessNuruExternalCandidate({ sourceId: "open-library", externalId: "x", type: "article", title: "A title", creator: null, summary: "A sufficiently descriptive summary.", topics: [], sourceUrl: "https://openlibrary.org/works/OL1W", publishedAt: null, retrievedAt: new Date().toISOString(), sourceAuthority: "MODERATE" })).toEqual({ accepted: false, reason: "SOURCE_TYPE_OUTSIDE_POLICY" });
  });
});
