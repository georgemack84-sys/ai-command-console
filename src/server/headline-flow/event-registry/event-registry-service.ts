import { createHash } from "node:crypto";
import type { CanonicalArticle, StoryPackage } from "@/src/server/headline-flow/domain/types";
import type {
  HeadlineFlowEventEvidence,
  HeadlineFlowEventRecord,
  HeadlineFlowEventRegistryIngestResult,
  HeadlineFlowEventRegistryRepository,
  HeadlineFlowEventRegistryStoryInput,
  HeadlineFlowEventUpdateReason,
} from "@/src/server/headline-flow/event-registry/types";

const MATCH_THRESHOLD = 0.62;
const DEFAULT_RESOLVE_AFTER_MS = 48 * 60 * 60 * 1000;

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "in",
  "into",
  "is",
  "it",
  "its",
  "new",
  "of",
  "on",
  "or",
  "over",
  "says",
  "the",
  "to",
  "with",
]);

function stableHash(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
}

function textTokens(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function tokenOverlapScore(a: string, b: string) {
  const left = textTokens(a);
  const right = textTokens(b);
  if (!left.length || !right.length) {
    return 0;
  }
  const rightSet = new Set(right);
  const overlap = left.filter((token) => rightSet.has(token)).length;
  return overlap / Math.min(left.length, right.length);
}

function eventMatchKey(story: StoryPackage) {
  const tokens = textTokens(story.headline).slice(0, 8).join("-");
  return `${story.topic}:${tokens || stableHash(story.headline)}`;
}

function storyEvidenceFromArticle(input: {
  story: StoryPackage;
  article: CanonicalArticle;
  observedAt: string;
  updateReason: HeadlineFlowEventUpdateReason;
}): HeadlineFlowEventEvidence {
  return {
    id: `evidence_${stableHash(`${input.story.id}|${input.article.id}|${input.article.canonicalUrl || input.article.fingerprint}`)}`,
    storyPackageId: input.story.id,
    articleId: input.article.id,
    providerId: input.article.providerId,
    providerArticleId: input.article.providerArticleId,
    sourceId: input.article.source.id,
    sourceName: input.article.source.name,
    articleUrl: input.article.canonicalUrl,
    articleFingerprint: input.article.fingerprint,
    author: input.article.author,
    imageUrl: input.article.imageUrl,
    headline: input.article.title,
    summary: input.article.description || input.story.shortSummary,
    topic: input.story.topic,
    publishedAt: input.article.publishedAt.toISOString(),
    retrievedAt: input.article.retrievedAt.toISOString(),
    observedAt: input.observedAt,
    updateReason: input.updateReason,
  };
}

function storyEvidence(input: HeadlineFlowEventRegistryStoryInput, observedAt: string): HeadlineFlowEventEvidence[] {
  const story = input.storyPackage;
  if (input.canonicalStory?.articles.length) {
    return input.canonicalStory.articles.map((article) =>
      storyEvidenceFromArticle({
        story,
        article,
        observedAt,
        updateReason: "new_evidence",
      }),
    );
  }

  const sources = story.sources.length
    ? story.sources
    : [{ id: `${story.id}:unknown-source`, name: story.sourceSummary || "Unknown source", url: null }];

  return sources.map((source) => ({
    id: `evidence_${stableHash(`${story.id}|${source.id}|${source.url || source.name}`)}`,
    storyPackageId: story.id,
    articleId: null,
    providerId: null,
    providerArticleId: null,
    sourceId: source.id,
    sourceName: source.name,
    articleUrl: source.url,
    articleFingerprint: null,
    author: null,
    imageUrl: story.displayMetadata.heroImageUrl,
    headline: story.headline,
    summary: story.shortSummary,
    topic: story.topic,
    publishedAt: story.publishedAt,
    retrievedAt: null,
    observedAt,
    updateReason: "new_evidence",
  }));
}

function evidenceKey(evidence: HeadlineFlowEventEvidence) {
  return evidence.articleUrl || evidence.providerArticleId || evidence.articleFingerprint || `${evidence.storyPackageId}:${evidence.sourceId}`;
}

function hasSharedEvidence(existing: HeadlineFlowEventRecord, input: HeadlineFlowEventRegistryStoryInput) {
  const existingKeys = new Set(existing.evidence.map(evidenceKey));
  return storyEvidence(input, existing.lastUpdatedAt).some((evidence) => existingKeys.has(evidenceKey(evidence)));
}

function matchesEvent(existing: HeadlineFlowEventRecord, input: HeadlineFlowEventRegistryStoryInput) {
  const story = input.storyPackage;
  if (existing.topic !== story.topic) {
    return false;
  }
  if (hasSharedEvidence(existing, input)) {
    return true;
  }
  return tokenOverlapScore(existing.title, story.headline) >= MATCH_THRESHOLD;
}

function sourceCount(evidence: HeadlineFlowEventEvidence[]) {
  return new Set(evidence.map((item) => item.sourceId)).size;
}

function articleCount(evidence: HeadlineFlowEventEvidence[]) {
  return new Set(evidence.map(evidenceKey)).size;
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function summarizeUpdate(input: {
  reasons: HeadlineFlowEventUpdateReason[];
  newEvidenceCount: number;
  newSourceCount: number;
  status: HeadlineFlowEventRecord["status"];
}) {
  if (input.status === "resolved") {
    return "No current evidence appeared in the active briefing window.";
  }
  if (input.reasons.includes("lead_angle_changed") && input.newSourceCount > 0) {
    return `Lead angle changed with ${pluralize(input.newSourceCount, "new source")} corroborating the story.`;
  }
  if (input.reasons.includes("source_corroboration")) {
    return `${pluralize(input.newSourceCount, "new source")} corroborated this story.`;
  }
  if (input.reasons.includes("lead_angle_changed")) {
    return "Lead angle changed since the previous event version.";
  }
  if (input.reasons.includes("new_evidence")) {
    return `${pluralize(input.newEvidenceCount, "new article")} added to this event.`;
  }
  if (input.reasons.includes("stale")) {
    return "No meaningful change since the previous event version.";
  }
  if (input.reasons.includes("duplicate")) {
    return "Duplicate evidence was ignored.";
  }
  return "Event continuity updated.";
}

function createEvent(input: { workspaceId: string; storyInput: HeadlineFlowEventRegistryStoryInput; observedAt: string }): HeadlineFlowEventRecord {
  const story = input.storyInput.storyPackage;
  const evidence = storyEvidence(input.storyInput, input.observedAt);
  return {
    id: `hfe_${stableHash(`${input.workspaceId}|${eventMatchKey(story)}`)}`,
    workspaceId: input.workspaceId,
    title: story.headline,
    summary: story.shortSummary,
    topic: story.topic,
    status: "new",
    importance: story.importance,
    confidence: story.confidence,
    firstDetectedAt: input.observedAt,
    lastUpdatedAt: input.observedAt,
    lastMeaningfulUpdateAt: input.observedAt,
    version: 1,
    matchKey: eventMatchKey(story),
    updateSummary: summarizeUpdate({
      reasons: ["new_evidence"],
      newEvidenceCount: evidence.length,
      newSourceCount: sourceCount(evidence),
      status: "new",
    }),
    updateReasons: ["new_evidence"],
    sourceCount: sourceCount(evidence),
    articleCount: articleCount(evidence),
    evidence,
  };
}

function mergeEvent(input: {
  existing: HeadlineFlowEventRecord;
  storyInput: HeadlineFlowEventRegistryStoryInput;
  observedAt: string;
}): { event: HeadlineFlowEventRecord; changed: boolean; updateReasons: HeadlineFlowEventUpdateReason[] } {
  const story = input.storyInput.storyPackage;
  const updateReasons = new Set<HeadlineFlowEventUpdateReason>();
  const evidenceByKey = new Map(input.existing.evidence.map((evidence) => [evidenceKey(evidence), evidence]));
  const existingSourceIds = new Set(input.existing.evidence.map((evidence) => evidence.sourceId));
  const newSourceIds = new Set<string>();
  let addedEvidenceCount = 0;
  for (const evidence of storyEvidence(input.storyInput, input.observedAt)) {
    const key = evidenceKey(evidence);
    if (evidenceByKey.has(key)) {
      updateReasons.add("duplicate");
      continue;
    }
    const updateReason: HeadlineFlowEventUpdateReason = existingSourceIds.has(evidence.sourceId)
      ? "new_evidence"
      : "source_corroboration";
    evidenceByKey.set(key, {
      ...evidence,
      updateReason,
    });
    updateReasons.add(updateReason);
    if (!existingSourceIds.has(evidence.sourceId)) {
      newSourceIds.add(evidence.sourceId);
    }
    addedEvidenceCount += 1;
  }

  const evidence = Array.from(evidenceByKey.values());
  const storyChanged =
    input.existing.title !== story.headline ||
    input.existing.summary !== story.shortSummary ||
    input.existing.importance !== story.importance ||
    input.existing.confidence !== story.confidence;
  if (storyChanged) {
    updateReasons.add("lead_angle_changed");
  }
  if (new Date(story.updatedAt).getTime() <= new Date(input.existing.lastMeaningfulUpdateAt).getTime() && addedEvidenceCount === 0 && !storyChanged) {
    updateReasons.add("stale");
  }
  const evidenceChanged = evidence.length !== input.existing.evidence.length;
  const changed = storyChanged || evidenceChanged;

  return {
    changed,
    updateReasons: Array.from(updateReasons),
    event: {
      ...input.existing,
      title: story.headline,
      summary: story.shortSummary,
      importance: story.importance,
      confidence: story.confidence,
      status: changed ? "updated" : input.existing.status === "new" ? "developing" : input.existing.status,
      lastUpdatedAt: input.observedAt,
      lastMeaningfulUpdateAt: changed ? input.observedAt : input.existing.lastMeaningfulUpdateAt,
      version: changed ? input.existing.version + 1 : input.existing.version,
      updateSummary: summarizeUpdate({
        reasons: Array.from(updateReasons),
        newEvidenceCount: addedEvidenceCount,
        newSourceCount: newSourceIds.size,
        status: changed ? "updated" : input.existing.status === "new" ? "developing" : input.existing.status,
      }),
      updateReasons: Array.from(updateReasons),
      sourceCount: sourceCount(evidence),
      articleCount: articleCount(evidence),
      evidence,
    },
  };
}

export class InMemoryHeadlineFlowEventRegistryRepository implements HeadlineFlowEventRegistryRepository {
  private readonly events = new Map<string, HeadlineFlowEventRecord>();

  async findByIdForWorkspace(eventId: string, workspaceId: string) {
    const event = this.events.get(eventId);
    return event?.workspaceId === workspaceId ? event : null;
  }

  async listByWorkspace(workspaceId: string) {
    return Array.from(this.events.values())
      .filter((event) => event.workspaceId === workspaceId)
      .sort((a, b) => b.lastUpdatedAt.localeCompare(a.lastUpdatedAt));
  }

  async upsert(event: HeadlineFlowEventRecord) {
    this.events.set(event.id, event);
    return event;
  }
}

export async function ingestStoryPackagesIntoEventRegistry(input: {
  workspaceId: string;
  stories: StoryPackage[];
  repository: HeadlineFlowEventRegistryRepository;
  now?: Date;
}): Promise<HeadlineFlowEventRegistryIngestResult> {
  return ingestHeadlineFlowStoriesIntoEventRegistry({
    ...input,
    stories: input.stories.map((storyPackage) => ({ storyPackage })),
  });
}

export async function ingestHeadlineFlowStoriesIntoEventRegistry(input: {
  workspaceId: string;
  stories: HeadlineFlowEventRegistryStoryInput[];
  repository: HeadlineFlowEventRegistryRepository;
  now?: Date;
  resolveAfterMs?: number;
}): Promise<HeadlineFlowEventRegistryIngestResult> {
  const observedAt = (input.now ?? new Date()).toISOString();
  const created: HeadlineFlowEventRecord[] = [];
  const updated: HeadlineFlowEventRecord[] = [];
  const unchanged: HeadlineFlowEventRecord[] = [];
  const resolved: HeadlineFlowEventRecord[] = [];
  const packageEvents: HeadlineFlowEventRegistryIngestResult["packageEvents"] = [];
  const knownEvents = await input.repository.listByWorkspace(input.workspaceId);
  const touchedEventIds = new Set<string>();

  for (const storyInput of input.stories) {
    const story = storyInput.storyPackage;
    const existing = knownEvents.find((event) => matchesEvent(event, storyInput));
    if (!existing) {
      const event = await input.repository.upsert(createEvent({ workspaceId: input.workspaceId, storyInput, observedAt }));
      knownEvents.push(event);
      touchedEventIds.add(event.id);
      created.push(event);
      packageEvents.push({
        storyPackageId: story.id,
        eventId: event.id,
        eventVersion: event.version,
        eventStatus: event.status,
        updateReasons: ["new_evidence"],
        updateSummary: event.updateSummary,
      });
      continue;
    }

    const merged = mergeEvent({ existing, storyInput, observedAt });
    const event = await input.repository.upsert(merged.event);
    touchedEventIds.add(event.id);
    const index = knownEvents.findIndex((knownEvent) => knownEvent.id === event.id);
    if (index >= 0) {
      knownEvents[index] = event;
    }
    if (merged.changed) {
      updated.push(event);
    } else {
      unchanged.push(event);
    }
    packageEvents.push({
      storyPackageId: story.id,
      eventId: event.id,
      eventVersion: event.version,
      eventStatus: event.status,
      updateReasons: merged.updateReasons,
      updateSummary: event.updateSummary,
    });
  }

  const resolveAfterMs = input.resolveAfterMs ?? DEFAULT_RESOLVE_AFTER_MS;
  const observedAtMs = new Date(observedAt).getTime();
  for (const event of knownEvents) {
    if (touchedEventIds.has(event.id) || event.status === "resolved") {
      continue;
    }
    const lastMeaningfulAtMs = new Date(event.lastMeaningfulUpdateAt).getTime();
    if (Number.isNaN(lastMeaningfulAtMs) || observedAtMs - lastMeaningfulAtMs < resolveAfterMs) {
      continue;
    }
    const nextEvent: HeadlineFlowEventRecord = {
      ...event,
      status: "resolved",
      lastUpdatedAt: observedAt,
      version: event.version + 1,
      updateReasons: ["stale"],
      updateSummary: summarizeUpdate({
        reasons: ["stale"],
        newEvidenceCount: 0,
        newSourceCount: 0,
        status: "resolved",
      }),
    };
    const resolvedEvent = await input.repository.upsert(nextEvent);
    resolved.push(resolvedEvent);
  }

  return {
    created,
    updated,
    unchanged,
    resolved,
    packageEvents,
    events: await input.repository.listByWorkspace(input.workspaceId),
  };
}
