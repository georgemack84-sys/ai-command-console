import Parser from "rss-parser";
import { z } from "zod";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { getNuruTasteRankingContext } from "@/src/server/services/nuru-taste-interview-service";

const policyVersion = "nuru-source-policy-v1";
export const nuruDiscoverySourceIds = ["open-library", "tmdb", "allowlisted-rss"] as const;
type SourceId = (typeof nuruDiscoverySourceIds)[number];
export const nuruDiscoverySourceRegistry: Record<SourceId, { label: string; purpose: string; allowedDomains: readonly string[]; eligibleTypes: readonly NuruExternalCandidate["type"][] }> = {
  "open-library": { label: "Open Library", purpose: "Stable bibliographic discovery", allowedDomains: ["openlibrary.org"], eligibleTypes: ["book"] },
  tmdb: { label: "TMDB", purpose: "Film and documentary discovery", allowedDomains: ["themoviedb.org"], eligibleTypes: ["documentary"] },
  "allowlisted-rss": { label: "Allowlisted publisher RSS", purpose: "Long-form editorial discovery", allowedDomains: [], eligibleTypes: ["article"] },
};
export const nuruRetrievalInputSchema = z.object({ query: z.string().trim().min(3).max(160), sources: z.array(z.enum(nuruDiscoverySourceIds)).min(1).max(3).default([...nuruDiscoverySourceIds]), limit: z.number().int().min(1).max(10).default(5) });
export type NuruExternalCandidate = { sourceId: SourceId; externalId: string; type: "book" | "documentary" | "article"; title: string; creator: string | null; summary: string; topics: string[]; sourceUrl: string; publishedAt: string | null; retrievedAt: string; sourceAuthority: "MODERATE" | "HIGH"; };
export type NuruRetrievalSourceOutcome = { sourceId: SourceId; state: "COMPLETED" | "FAILED"; candidateCount: number; cached: boolean; failureCode: "SOURCE_UNAVAILABLE" | "CONFIGURATION_MISSING" | null };
type CachedSourceCandidates = { expiresAt: number; candidates: NuruExternalCandidate[] };
const sourceCache = new Map<string, CachedSourceCandidates>();
const lastSourceRequestAt = new Map<SourceId, number>();
const sourceCacheTtlMs = 5 * 60 * 1_000;
const sourceMinimumIntervalMs: Record<SourceId, number> = { "open-library": 500, tmdb: 250, "allowlisted-rss": 500 };

function configuredRssUrls() {
  const raw = process.env.NURU_DISCOVERY_RSS_URLS;
  if (!raw) return [];
  return raw.split(",").map((url) => url.trim()).filter((url) => /^https:\/\//.test(url));
}

/** Reports configuration state without returning contact details, feed URLs, or credentials. */
export function getNuruDiscoverySourceReadiness() {
  const rssFeedCount = configuredRssUrls().length;
  return {
    policyVersion,
    sources: [
      { sourceId: "open-library" as const, ready: Boolean(process.env.NURU_SOURCE_CONTACT?.trim()), missingConfiguration: process.env.NURU_SOURCE_CONTACT?.trim() ? null : "Set NURU_SOURCE_CONTACT to an application contact address." },
      { sourceId: "tmdb" as const, ready: Boolean(process.env.TMDB_ACCESS_TOKEN?.trim()), missingConfiguration: process.env.TMDB_ACCESS_TOKEN?.trim() ? null : "Set TMDB_ACCESS_TOKEN in the deployment secret store." },
      { sourceId: "allowlisted-rss" as const, ready: rssFeedCount > 0, missingConfiguration: rssFeedCount ? null : "Set NURU_DISCOVERY_RSS_URLS to one or more allowlisted HTTPS feeds.", configuredFeedCount: rssFeedCount },
    ],
  };
}

type RetrievalRunHealthInput = { sourceId: string; status: string; candidateCount: number; startedAt: Date; completedAt: Date | null };
const sourceFreshnessMs = 24 * 60 * 60 * 1_000;

/** Produces bounded operational state; raw upstream errors remain in the audit record. */
export function summarizeNuruDiscoverySourceHealth(runs: RetrievalRunHealthInput[], now = new Date()) {
  return nuruDiscoverySourceIds.map((sourceId) => {
    const latest = runs.filter((run) => run.sourceId === sourceId).sort((left, right) => right.startedAt.getTime() - left.startedAt.getTime())[0];
    if (!latest) return { sourceId, state: "NOT_YET_RUN" as const, lastRetrievedAt: null, candidateCount: 0 };
    if (latest.status !== "COMPLETED") return { sourceId, state: "DEGRADED" as const, lastRetrievedAt: latest.completedAt?.toISOString() ?? null, candidateCount: 0 };
    const retrievedAt = latest.completedAt ?? latest.startedAt;
    return { sourceId, state: now.getTime() - retrievedAt.getTime() <= sourceFreshnessMs ? "HEALTHY" as const : "STALE" as const, lastRetrievedAt: retrievedAt.toISOString(), candidateCount: latest.candidateCount };
  });
}

/** Compact operational metrics for source expansion decisions, never personalized ranking. */
export function summarizeNuruDiscoverySourceOperations(runs: RetrievalRunHealthInput[]) {
  return nuruDiscoverySourceIds.map((sourceId) => {
    const sourceRuns = runs.filter((run) => run.sourceId === sourceId);
    const completed = sourceRuns.filter((run) => run.status === "COMPLETED");
    const durations = completed.flatMap((run) => run.completedAt ? [Math.max(0, run.completedAt.getTime() - run.startedAt.getTime())] : []);
    const candidatesRetrieved = completed.reduce((total, run) => total + run.candidateCount, 0);
    return {
      sourceId,
      attempts: sourceRuns.length,
      completed: completed.length,
      failureRate: sourceRuns.length ? (sourceRuns.length - completed.length) / sourceRuns.length : null,
      averageLatencyMs: durations.length ? Math.round(durations.reduce((total, duration) => total + duration, 0) / durations.length) : null,
      candidatesRetrieved,
    };
  });
}

export async function getNuruDiscoverySourceHealth() {
  const runs = await nuruKnowledgeRepository.nuruDiscoveryRetrievalRun.findMany({
    where: { sourceId: { in: nuruDiscoverySourceIds } },
    orderBy: { startedAt: "desc" },
    take: 30,
    select: { sourceId: true, status: true, candidateCount: true, startedAt: true, completedAt: true },
  });
  return { policyVersion, freshnessWindowHours: 24, sources: summarizeNuruDiscoverySourceHealth(runs), operations: summarizeNuruDiscoverySourceOperations(runs) };
}

/** R2 may pass only when every approved source is configured and has a fresh successful retrieval. */
export function evaluateNuruAutonomousPoolReleaseGate(
  readiness: Array<{ sourceId: SourceId; ready: boolean }>,
  health: Array<{ sourceId: SourceId; state: "NOT_YET_RUN" | "HEALTHY" | "STALE" | "DEGRADED" }>,
  coverage: Partial<Record<SourceId, number>> = {},
) {
  const blockers: Array<{ sourceId: SourceId; code: "CONFIGURATION_MISSING" | "LIVE_RETRIEVAL_UNVERIFIED" | "CANDIDATE_COVERAGE_MISSING" }> = [];
  for (const sourceId of nuruDiscoverySourceIds) {
    const sourceReadiness = readiness.find((source) => source.sourceId === sourceId);
    const sourceHealth = health.find((source) => source.sourceId === sourceId);
    if (!sourceReadiness?.ready) { blockers.push({ sourceId, code: "CONFIGURATION_MISSING" }); continue; }
    if (sourceHealth?.state !== "HEALTHY") { blockers.push({ sourceId, code: "LIVE_RETRIEVAL_UNVERIFIED" }); continue; }
    if ((coverage[sourceId] ?? 0) < 1) blockers.push({ sourceId, code: "CANDIDATE_COVERAGE_MISSING" });
  }
  return { release: "R2_AUTONOMOUS_POOL" as const, passed: blockers.length === 0, blockers };
}

export async function getNuruAutonomousPoolReleaseGate() {
  const readiness = getNuruDiscoverySourceReadiness();
  const health = await getNuruDiscoverySourceHealth();
  const candidates = await nuruKnowledgeRepository.nuruDiscoveryCandidate.findMany({ where: { externalKey: { not: null }, status: "ELIGIBLE" }, select: { externalKey: true, status: true } });
  const coverage = candidates.reduce<Partial<Record<SourceId, number>>>((counts, candidate) => {
    const sourceId = nuruDiscoverySourceIds.find((id) => candidate.externalKey?.startsWith(`${id}:`));
    if (sourceId) counts[sourceId] = (counts[sourceId] ?? 0) + 1;
    return counts;
  }, {});
  return evaluateNuruAutonomousPoolReleaseGate(readiness.sources, health.sources, coverage);
}
function compactTopics(values: unknown) { return Array.isArray(values) ? [...new Set(values.filter((value): value is string => typeof value === "string").map((value) => value.trim()).filter(Boolean))].slice(0, 8) : []; }
function sourceDomains(sourceId: SourceId) { return nuruDiscoverySourceRegistry[sourceId].allowedDomains; }

/** Rejects malformed, off-policy, and duplicate-in-run candidates before persistence. */
export function assessNuruExternalCandidate(candidate: NuruExternalCandidate, rssUrls = configuredRssUrls()) {
  try {
    const url = new URL(candidate.sourceUrl); const domains = sourceDomains(candidate.sourceId);
    const hostAllowed = domains.length ? domains.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`)) : rssUrls.some((feed) => new URL(feed).hostname === url.hostname);
    if (url.protocol !== "https:" || !hostAllowed) return { accepted: false as const, reason: "SOURCE_URL_OUTSIDE_POLICY" };
    if (!nuruDiscoverySourceRegistry[candidate.sourceId].eligibleTypes.includes(candidate.type)) return { accepted: false as const, reason: "SOURCE_TYPE_OUTSIDE_POLICY" };
    if (!candidate.title.trim() || candidate.summary.trim().length < 12) return { accepted: false as const, reason: "INSUFFICIENT_METADATA" };
    return { accepted: true as const, externalKey: `${candidate.sourceId}:${candidate.externalId}` };
  } catch { return { accepted: false as const, reason: "INVALID_SOURCE_URL" }; }
}

export type DiscoveryBatchRejection = { candidate: NuruExternalCandidate; reason: "STALE_RETRIEVAL" | "DUPLICATE_IN_RUN" | "SOURCE_URL_OUTSIDE_POLICY" | "SOURCE_TYPE_OUTSIDE_POLICY" | "INSUFFICIENT_METADATA" | "INVALID_SOURCE_URL" };
const candidateFreshnessMs = 24 * 60 * 60 * 1_000;

/**
 * Qualifies a bounded discovery batch before persistence.  A discovery result
 * is still only a candidate: duplicates are retained as diagnostics, stale
 * material is not presented as new, and similarly titled independent sources
 * are explicitly routed to quality review rather than silently merged.
 */
export function qualifyNuruDiscoveryBatch(candidates: readonly NuruExternalCandidate[], now = new Date(), rssUrls = configuredRssUrls()) {
  const accepted: Array<{ candidate: NuruExternalCandidate; externalKey: string }> = [];
  const rejected: DiscoveryBatchRejection[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const assessment = assessNuruExternalCandidate(candidate, rssUrls);
    if (!assessment.accepted) {
      rejected.push({ candidate, reason: assessment.reason as DiscoveryBatchRejection["reason"] });
      continue;
    }
    const retrievedAt = Date.parse(candidate.retrievedAt);
    if (!Number.isFinite(retrievedAt) || now.getTime() - retrievedAt > candidateFreshnessMs) { rejected.push({ candidate, reason: "STALE_RETRIEVAL" }); continue; }
    if (seen.has(assessment.externalKey)) { rejected.push({ candidate, reason: "DUPLICATE_IN_RUN" }); continue; }
    seen.add(assessment.externalKey);
    accepted.push({ candidate, externalKey: assessment.externalKey });
  }
  const titleGroups = new Map<string, string[]>();
  for (const item of accepted) {
    const key = `${item.candidate.type}:${item.candidate.title.trim().toLocaleLowerCase()}`;
    titleGroups.set(key, [...(titleGroups.get(key) ?? []), item.externalKey]);
  }
  const conflictedExternalKeys = new Set([...titleGroups.values()].filter((keys) => keys.length > 1).flat());
  return { accepted, rejected, conflictedExternalKeys };
}

function sourceFailureCode(error: unknown): NuruRetrievalSourceOutcome["failureCode"] {
  return error instanceof Error && /requires (NURU_SOURCE_CONTACT|TMDB_ACCESS_TOKEN|NURU_DISCOVERY_RSS_URLS)/.test(error.message) ? "CONFIGURATION_MISSING" : "SOURCE_UNAVAILABLE";
}

async function retrieveWithSourcePolicy(sourceId: SourceId, query: string, limit: number) {
  const cacheKey = `${sourceId}:${query.toLocaleLowerCase()}:${limit}`;
  const cached = sourceCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return { candidates: cached.candidates, cached: true };
  const waitMs = Math.max(0, sourceMinimumIntervalMs[sourceId] - (Date.now() - (lastSourceRequestAt.get(sourceId) ?? 0)));
  if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
  lastSourceRequestAt.set(sourceId, Date.now());
  const candidates = await adapters[sourceId](query, limit);
  sourceCache.set(cacheKey, { candidates, expiresAt: Date.now() + sourceCacheTtlMs });
  return { candidates, cached: false };
}

export function buildNuruTasteRetrievalPlan(signals: Array<{ concept: string; dimension: string; polarity: number; confidence: number }>) {
  return signals.filter((signal) => signal.polarity > 0 && ["SUBJECT", "ATTENTION_LENS"].includes(signal.dimension)).sort((left, right) => right.confidence - left.confidence || left.concept.localeCompare(right.concept)).map((signal) => signal.concept).filter((concept, index, all) => all.findIndex((entry) => entry.toLocaleLowerCase() === concept.toLocaleLowerCase()) === index).slice(0, 3);
}

export async function retrieveOpenLibrary(query: string, limit: number, fetchImpl: typeof fetch = fetch): Promise<NuruExternalCandidate[]> {
  const contact = process.env.NURU_SOURCE_CONTACT;
  if (!contact) throw new Error("Open Library retrieval requires NURU_SOURCE_CONTACT for an identified, low-volume request.");
  const url = new URL("https://openlibrary.org/search.json"); url.searchParams.set("q", query); url.searchParams.set("limit", String(limit)); url.searchParams.set("fields", "key,title,author_name,first_publish_year,subject");
  const response = await fetchImpl(url, { headers: { "User-Agent": `Nuru Discovery/0.1 (${contact})`, Accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`Open Library returned ${response.status}.`);
  const payload = await response.json() as { docs?: Array<Record<string, unknown>> };
  const retrievedAt = new Date().toISOString();
  return (payload.docs ?? []).flatMap((doc) => typeof doc.key === "string" && typeof doc.title === "string" ? [{ sourceId: "open-library" as const, externalId: doc.key, type: "book" as const, title: doc.title, creator: Array.isArray(doc.author_name) && typeof doc.author_name[0] === "string" ? doc.author_name[0] : null, summary: `A book discovered through Open Library: ${doc.title}.`, topics: compactTopics([query, ...(Array.isArray(doc.subject) ? doc.subject : [])]), sourceUrl: `https://openlibrary.org${doc.key}`, publishedAt: typeof doc.first_publish_year === "number" ? `${doc.first_publish_year}-01-01` : null, retrievedAt, sourceAuthority: "MODERATE" as const }] : []);
}

export async function retrieveTmdb(query: string, limit: number, fetchImpl: typeof fetch = fetch): Promise<NuruExternalCandidate[]> {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) throw new Error("TMDB retrieval requires TMDB_ACCESS_TOKEN.");
  const url = new URL("https://api.themoviedb.org/3/search/movie"); url.searchParams.set("query", query); url.searchParams.set("include_adult", "false"); url.searchParams.set("language", "en-US");
  const response = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`TMDB returned ${response.status}.`);
  const payload = await response.json() as { results?: Array<{ id?: number; title?: string; overview?: string; release_date?: string; genre_ids?: number[] }> };
  const retrievedAt = new Date().toISOString();
  return (payload.results ?? []).filter((movie) => movie.genre_ids?.includes(99)).slice(0, limit).flatMap((movie) => typeof movie.id === "number" && movie.title ? [{ sourceId: "tmdb" as const, externalId: String(movie.id), type: "documentary" as const, title: movie.title, creator: null, summary: movie.overview?.trim() || "TMDB did not provide an overview for this title.", topics: [query], sourceUrl: `https://www.themoviedb.org/movie/${movie.id}`, publishedAt: movie.release_date || null, retrievedAt, sourceAuthority: "MODERATE" as const }] : []);
}

function queryMatchesRssItem(query: string, text: string) {
  const normalized = query.toLocaleLowerCase();
  if (text.includes(normalized)) return true;
  const terms = normalized.split(/[^\p{L}\p{N}]+/u).filter((term) => term.length >= 3);
  return terms.length > 0 && terms.filter((term) => text.includes(term)).length / terms.length >= 0.5;
}

export async function retrieveAllowlistedRss(query: string, limit: number, fetchImpl: typeof fetch = fetch): Promise<NuruExternalCandidate[]> {
  const urls = configuredRssUrls();
  if (!urls.length) throw new Error("RSS retrieval requires NURU_DISCOVERY_RSS_URLS with one or more allowlisted HTTPS feeds.");
  const parser = new Parser(); const candidates: NuruExternalCandidate[] = []; let successfulFeeds = 0;
  for (const feedUrl of urls.slice(0, 5)) {
    const response = await fetchImpl(feedUrl, { headers: { "User-Agent": "Nuru Discovery/0.1 (+https://nuru.local)", Accept: "application/rss+xml, application/xml, text/xml" }, signal: AbortSignal.timeout(8_000) });
    if (!response.ok) continue;
    successfulFeeds += 1;
    const feed = await parser.parseString(await response.text());
    for (const item of feed.items ?? []) {
      const text = `${item.title ?? ""} ${item.contentSnippet ?? item.content ?? ""}`.toLocaleLowerCase();
      if (!queryMatchesRssItem(query, text) || !item.title || !item.link) continue;
      candidates.push({ sourceId: "allowlisted-rss", externalId: item.guid ?? item.link, type: "article", title: item.title, creator: item.creator ?? null, summary: item.contentSnippet ?? "An article from an allowlisted publication.", topics: [query], sourceUrl: item.link, publishedAt: item.isoDate ?? item.pubDate ?? null, retrievedAt: new Date().toISOString(), sourceAuthority: "HIGH" });
      if (candidates.length >= limit) return candidates;
    }
  }
  if (!successfulFeeds) throw new Error("No allowlisted RSS feed responded successfully.");
  return candidates;
}

const adapters: Record<SourceId, (query: string, limit: number) => Promise<NuruExternalCandidate[]>> = { "open-library": retrieveOpenLibrary, tmdb: retrieveTmdb, "allowlisted-rss": retrieveAllowlistedRss };

/** Retrieves candidates only. Every result remains non-canonical and needs the existing trust layer before user presentation. */
export async function retrieveNuruDiscoveryCandidatesWithStatus(rawInput: z.input<typeof nuruRetrievalInputSchema>) {
  const input = nuruRetrievalInputSchema.parse(rawInput); const all: NuruExternalCandidate[] = [];
  const sources: NuruRetrievalSourceOutcome[] = [];
  for (const sourceId of input.sources) {
    const run = await nuruKnowledgeRepository.nuruDiscoveryRetrievalRun.create({ data: { sourceId, query: input.query, status: "RUNNING", policyVersion } });
    try {
      const retrieved = await retrieveWithSourcePolicy(sourceId, input.query, input.limit);
      const qualification = qualifyNuruDiscoveryBatch(retrieved.candidates);
      const candidates = qualification.accepted.map((item) => item.candidate);
      await nuruKnowledgeRepository.$transaction(async (tx) => {
        for (const item of qualification.accepted) { const { candidate, externalKey } = item; const conflictDetected = qualification.conflictedExternalKeys.has(externalKey); const persisted = await tx.nuruDiscoveryCandidate.upsert({ where: { externalKey }, create: { title: candidate.title, content: candidate.summary, source: { sourceType: "WEB_SOURCE", origin: candidate.sourceUrl, uri: candidate.sourceUrl, authority: candidate.sourceAuthority, retrievedAt: candidate.retrievedAt, topics: candidate.topics, publishedAt: candidate.publishedAt }, reasonDiscovered: `Retrieved from ${candidate.sourceId} for query “${input.query}”.`, initialType: candidate.type, relevanceScore: 50, confidence: candidate.sourceAuthority === "HIGH" ? 0.75 : 0.65, status: "ELIGIBLE", createdBy: `nuru.source.${candidate.sourceId}.v1`, correlationId: run.id, externalKey }, update: { correlationId: run.id, status: "ELIGIBLE", source: { sourceType: "WEB_SOURCE", origin: candidate.sourceUrl, uri: candidate.sourceUrl, authority: candidate.sourceAuthority, retrievedAt: candidate.retrievedAt, topics: candidate.topics, publishedAt: candidate.publishedAt } } }); await tx.nuruQualityAssessment.create({ data: { itemId: persisted.id, status: conflictDetected ? "NEEDS_REVIEW" : "PASS", sourceKnown: true, provenanceAvailable: true, duplicateState: "EXTERNAL_KEY_DEDUPED", conflictDetected, contextAccurate: true, relationshipsJustified: true, evidenceSufficient: true, confidence: candidate.sourceAuthority === "HIGH" ? 0.75 : 0.65, warnings: conflictDetected ? ["Independent discovery candidates share the same title and require review."] : [], createdBy: "nuru.source-eligibility.v1", correlationId: run.id } }); }
        await tx.nuruDiscoveryRetrievalRun.update({ where: { id: run.id }, data: { status: "COMPLETED", candidateCount: candidates.length, completedAt: new Date() } });
      });
      all.push(...candidates); sources.push({ sourceId, state: "COMPLETED", candidateCount: candidates.length, cached: retrieved.cached, failureCode: null });
    } catch (error) { await nuruKnowledgeRepository.nuruDiscoveryRetrievalRun.update({ where: { id: run.id }, data: { status: "FAILED", failureReason: error instanceof Error ? error.message.slice(0, 1_000) : "Unknown retrieval failure", completedAt: new Date() } }); sources.push({ sourceId, state: "FAILED", candidateCount: 0, cached: false, failureCode: sourceFailureCode(error) }); }
  }
  return { candidates: all, sources };
}

export async function retrieveNuruDiscoveryCandidates(rawInput: z.input<typeof nuruRetrievalInputSchema>) {
  return (await retrieveNuruDiscoveryCandidatesWithStatus(rawInput)).candidates;
}

export async function retrieveNuruTasteMapCandidates(userId: string) {
  const { signals } = await getNuruTasteRankingContext(userId);
  const queries = buildNuruTasteRetrievalPlan(signals);
  const results = await Promise.all(queries.map((query) => retrieveNuruDiscoveryCandidates({ query, sources: [...nuruDiscoverySourceIds], limit: 5 })));
  return { queries, candidates: results.flat() };
}
