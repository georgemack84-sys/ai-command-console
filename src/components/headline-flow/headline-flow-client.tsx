"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  Building2,
  Clock,
  CloudSun,
  Cpu,
  ExternalLink,
  FileText,
  Grid3X3,
  HeartPulse,
  Images,
  Landmark,
  List,
  LucideIcon,
  Mic,
  Microscope,
  Newspaper,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Settings,
  ShieldCheck,
  SkipBack,
  SkipForward,
  Sparkles,
  Trophy,
  TrendingUp,
  Volume2,
  Waves,
  Wifi,
  X,
  Clapperboard,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { HeadlineFlowFeed, HeadlineFlowTopic, StoryPackage } from "@/src/server/headline-flow/domain/types";
import type { HeadlineFlowEventRecord } from "@/src/server/headline-flow/event-registry/types";

type HeadlineFlowApiPayload = {
  mode: "fixture" | "rss" | "web_search";
  requestedProvider: ProviderMode;
  diagnostics: ProviderDiagnostics;
  workspaceId: string;
  feed: HeadlineFlowFeed;
};

type ApiResponse =
  | { ok: true; data: HeadlineFlowApiPayload }
  | { ok: false; error?: { message?: string; code?: string } };

type EventApiResponse =
  | { ok: true; data: { workspaceId: string; event: HeadlineFlowEventRecord; preference: EventPreferenceSummary } }
  | { ok: false; error?: { message?: string; code?: string } };

type EventActionApiResponse =
  | { ok: true; data: { workspaceId: string; eventId: string; action: string; preference: EventPreferenceSummary } }
  | { ok: false; error?: { message?: string; code?: string } };

type EventPreferencesApiResponse =
  | {
      ok: true;
      data: {
        workspaceId: string;
        events: Array<{ event: HeadlineFlowEventRecord; preference: EventPreferenceSummary }>;
      };
    }
  | { ok: false; error?: { message?: string; code?: string } };

type InteractionSummary = {
  totalEvents: number;
  actionCounts: Record<string, number>;
  topicCounts: Record<string, number>;
  savedTopicCounts: Record<string, number>;
  mutedTopicCounts: Record<string, number>;
  sourceOpenRate: number;
};

type InteractionSummaryWindow = "24h" | "7d" | "all";

type InteractionWindowedSummary = {
  retentionDays: number;
  prunedEvents: number;
  windows: Record<InteractionSummaryWindow, InteractionSummary>;
};

type InteractionApiResponse =
  | { ok: true; data: { workspaceId: string; summary: InteractionWindowedSummary } }
  | { ok: true; data: { workspaceId: string; event: unknown; summary: InteractionWindowedSummary } }
  | { ok: false; error?: { message?: string; code?: string } };

type HeadlineFlowReadiness = {
  status: "ready" | "degraded" | "not_ready";
  summary: string;
  checks: {
    rss: { ok: boolean; status: "available" };
    webSearch: { ok: boolean; status: "configured" | "missing_configuration" };
    fixtureFallback: { ok: boolean; status: "enabled" | "disabled" };
    feed: {
      status: "healthy" | "degraded" | "not_started";
      storyCount: number;
      topicCount: number;
      minReadyStories: number;
      minReadyTopics: number;
      fixtureBacked: boolean;
      productionReady: boolean;
    };
  };
  warnings: Array<{ code: string; message: string }>;
  blockers: Array<{ code: string; message: string }>;
};

type ReadinessApiResponse =
  | { ok: true; data: { workspaceId: string; readiness: HeadlineFlowReadiness } }
  | { ok: false; error?: { message?: string; code?: string } };

type EventPreferenceSummary = {
  saved: boolean;
  muted: boolean;
  resolved: boolean;
};

type ProviderMode = "auto" | "fixture" | "rss" | "web_search";

type ProviderDiagnostics = {
  requestedProvider: ProviderMode;
  configuredProvider: ProviderMode;
  selectedProvider: "fixture" | "rss" | "web_search";
  fallbackReason: string | null;
  providerError: string | null;
  webSearchConfigured: boolean;
  cache?: {
    status: "hit" | "miss" | "stale" | "disabled";
    ageMs: number;
    ttlMs: number;
    staleMaxAgeMs?: number;
  };
  provider: {
    rejectedArticleUrls?: Array<{ url: string; reason: string; title: string | null }>;
    rejectedOutOfWindow?: number;
    linkResolution?: {
      attempted: number;
      resolved: number;
      unresolved: number;
      rejected: number;
      direct: number;
      skipped: number;
    };
    imageExtraction?: {
      attempted: number;
      found: number;
      fallback: number;
      rejected: number;
    };
    rawResponse?: {
      responseCount: number;
      totalTextLength: number;
      lastTextLength: number;
      parseStrategies: string[];
      parsedArticleCount: number;
      parseErrors: string[];
    };
    discoveryStrategy?: "targeted" | "broad" | "targeted_fill" | "rss_broad" | "rss_targeted";
    freshnessWindowHours?: number;
    topicCoverage?: {
      attemptedTopics: string[];
      fulfilledTopics: string[];
      topicArticleCounts?: Record<string, number>;
      lowYieldTopics?: string[];
      failedTopics: Array<{ topic: string; error: string }>;
    };
    error?: string | null;
  } | null;
};

const topicOptions: Array<{ label: string; value: HeadlineFlowTopic | "all" }> = [
  { label: "All", value: "all" },
  { label: "World", value: "world" },
  { label: "Politics", value: "politics" },
  { label: "Business", value: "business" },
  { label: "Technology", value: "technology" },
  { label: "Science", value: "science" },
  { label: "Health", value: "health" },
  { label: "Sports", value: "sports" },
  { label: "Culture", value: "entertainment" },
];

const providerOptions: Array<{ label: string; value: ProviderMode }> = [
  { label: "Auto", value: "auto" },
  { label: "RSS", value: "rss" },
  { label: "Search", value: "web_search" },
  { label: "Fixture", value: "fixture" },
];

const fallbackProviderDiagnostics: ProviderDiagnostics = {
  requestedProvider: "auto",
  configuredProvider: "auto",
  selectedProvider: "fixture",
  fallbackReason: "client_fallback",
  providerError: null,
  webSearchConfigured: false,
  provider: null,
};

const fallbackFeed: HeadlineFlowFeed = {
  generatedAt: new Date(0).toISOString(),
  providerId: "fixture-news",
  stories: [
    {
      id: "fallback-story",
      eventId: "fallback-event",
      headline: "Headline Flow is ready for a live feed",
      shortSummary: "Sign in to load the authenticated fixture feed and verify the product surface end to end.",
      narration: "The interface is wired to the internal feed endpoint and can refresh once authenticated.",
      topic: "general",
      importance: "awareness",
      confidence: "single_source",
      status: "developing",
      sourceSummary: "Fixture preview",
      sourceCount: 1,
      sources: [{ id: "fixture-source", name: "Headline Flow", url: null }],
      publishedAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
      displayMetadata: {
        rankingReason: "Fallback content shown while the authenticated API is unavailable.",
        briefingScore: 1,
        prioritySignals: ["Authenticated feed unavailable"],
        personalizationReason: null,
        rankingAudit: {
          baseScore: 1,
          personalizationBoost: 0,
          finalScore: 1,
          originalRank: 1,
          personalizedRank: 1,
        },
        whyItMatters: "The fallback story confirms the Headline Flow surface is available while the live briefing endpoint is unavailable.",
        articleCount: 1,
        heroImageUrl: null,
        freshness: {
          bucket: "past_48h",
          label: "Past 48h",
          ageMinutes: 2_880,
        },
      },
    },
  ],
  diagnostics: {
    receivedArticles: 0,
    acceptedArticles: 0,
    rejectedArticles: 0,
    duplicateArticles: 0,
    storyCount: 1,
    rejections: [],
  },
};

type RailView = "flow" | "brief" | "saved" | "topics" | "settings";
type DetailMode = "overview" | "timeline" | "sources" | "why" | "diagnostics";
type EventLibraryFilter = "saved" | "muted" | "resolved";

const railItems: Array<{ label: string; value: RailView; icon: LucideIcon }> = [
  { label: "Flow", value: "flow", icon: Waves },
  { label: "Brief", value: "brief", icon: FileText },
  { label: "Saved", value: "saved", icon: Bookmark },
  { label: "Topics", value: "topics", icon: Grid3X3 },
  { label: "Settings", value: "settings", icon: Settings },
];

const topicAccents: Record<HeadlineFlowTopic, string> = {
  world: "from-sky-500 via-cyan-300 to-slate-950",
  politics: "from-blue-500 via-slate-300 to-slate-950",
  business: "from-emerald-400 via-lime-200 to-slate-950",
  technology: "from-violet-500 via-cyan-300 to-slate-950",
  science: "from-teal-400 via-indigo-300 to-slate-950",
  health: "from-rose-400 via-emerald-200 to-slate-950",
  sports: "from-orange-400 via-amber-200 to-slate-950",
  entertainment: "from-fuchsia-500 via-rose-300 to-slate-950",
  general: "from-slate-400 via-cyan-200 to-slate-950",
};

const topicVisuals: Record<HeadlineFlowTopic, { image: string; alt: string }> = {
  world: {
    image: "/headline-flow/topic-world.svg",
    alt: "Earth seen from orbit",
  },
  politics: {
    image: "/headline-flow/topic-politics.svg",
    alt: "Government building columns",
  },
  business: {
    image: "/headline-flow/topic-business.svg",
    alt: "Financial market chart",
  },
  technology: {
    image: "/headline-flow/topic-technology.svg",
    alt: "Electronic circuit board",
  },
  science: {
    image: "/headline-flow/topic-science.svg",
    alt: "Laboratory glassware",
  },
  health: {
    image: "/headline-flow/topic-health.svg",
    alt: "Medical heart monitor",
  },
  sports: {
    image: "/headline-flow/topic-sports.svg",
    alt: "Athletes running on a track",
  },
  entertainment: {
    image: "/headline-flow/topic-entertainment.svg",
    alt: "Movie theater seats and screen",
  },
  general: {
    image: "/headline-flow/topic-general.svg",
    alt: "Newspapers stacked on a desk",
  },
};

const topicVisualMetadata: Record<HeadlineFlowTopic, { icon: LucideIcon; signal: string; visualLabel: string }> = {
  world: { icon: Building2, signal: "Global desk", visualLabel: "International context" },
  politics: { icon: Landmark, signal: "Civic desk", visualLabel: "Policy watch" },
  business: { icon: TrendingUp, signal: "Markets desk", visualLabel: "Economic signal" },
  technology: { icon: Cpu, signal: "Tech desk", visualLabel: "Platform shift" },
  science: { icon: Microscope, signal: "Science desk", visualLabel: "Research signal" },
  health: { icon: HeartPulse, signal: "Health desk", visualLabel: "Public impact" },
  sports: { icon: Trophy, signal: "Sports desk", visualLabel: "Competitive picture" },
  entertainment: { icon: Clapperboard, signal: "Culture desk", visualLabel: "Media signal" },
  general: { icon: Newspaper, signal: "News desk", visualLabel: "Briefing lead" },
};

function formatTimestamp(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function topicLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function topicTone(value: string) {
  if (value === "business") return "text-emerald-300";
  if (value === "sports") return "text-orange-300";
  if (value === "technology") return "text-violet-300";
  if (value === "science") return "text-cyan-300";
  if (value === "health") return "text-rose-300";
  if (value === "entertainment") return "text-fuchsia-300";
  return "text-sky-300";
}

function providerLabel(value: ProviderDiagnostics["selectedProvider"]) {
  if (value === "web_search") return "Live Search";
  if (value === "rss") return "RSS Feed";
  return "Fixture Feed";
}

function readinessLabel(readiness: HeadlineFlowReadiness | null) {
  if (!readiness) return "Checking live readiness";
  if (readiness.status === "ready") return "Live ready";
  if (readiness.status === "not_ready") return "Live not ready";
  return "Live degraded";
}

function readinessTone(readiness: HeadlineFlowReadiness | null) {
  if (!readiness) return "border-white/10 bg-white/5 text-slate-300";
  if (readiness.status === "ready") return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
  if (readiness.status === "not_ready") return "border-rose-300/25 bg-rose-300/10 text-rose-100";
  return "border-amber-300/25 bg-amber-300/10 text-amber-100";
}

function cacheLabel(cache: ProviderDiagnostics["cache"]) {
  if (!cache) {
    return "unknown";
  }
  if (cache.status === "disabled") {
    return "disabled";
  }
  return `${cache.status}, ${Math.round(cache.ageMs / 1000)}s old`;
}

function formatCounts(counts?: Record<string, number>) {
  const entries = Object.entries(counts ?? {}).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    return "none";
  }
  return entries.slice(0, 2).map(([name, count]) => `${topicLabel(name)} ${count}`).join(", ");
}

function updateReasonLabel(value: HeadlineFlowEventRecord["evidence"][number]["updateReason"]) {
  if (value === "source_corroboration") return "Source corroboration";
  if (value === "lead_angle_changed") return "Lead angle changed";
  if (value === "duplicate") return "Duplicate";
  if (value === "stale") return "Stale";
  return "New evidence";
}

function storyUpdateReasons(story?: StoryPackage): HeadlineFlowEventRecord["updateReasons"] {
  return story?.eventMetadata?.updateReasons ?? [];
}

function storyUpdateSummary(story?: StoryPackage) {
  if (story?.eventMetadata?.updateSummary) {
    return story.eventMetadata.updateSummary;
  }
  if (!story) {
    return "Waiting for the next event update.";
  }
  return story.status === "confirmed"
    ? "Current package is confirmed by multiple signals."
    : "Current package is still developing.";
}

function storyEvolutionTone(story?: StoryPackage) {
  const reasons = storyUpdateReasons(story);
  if (story?.eventMetadata?.status === "resolved") {
    return "border-slate-300/15 bg-slate-300/8 text-slate-200";
  }
  if (reasons.includes("lead_angle_changed")) {
    return "border-amber-300/25 bg-amber-300/10 text-amber-100";
  }
  if (reasons.includes("source_corroboration")) {
    return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
  }
  if (reasons.includes("new_evidence")) {
    return "border-sky-300/25 bg-sky-300/10 text-sky-100";
  }
  return "border-white/10 bg-white/[0.035] text-slate-200";
}

function storyVisual(story?: StoryPackage) {
  const topic = story?.topic ?? "general";
  const articleImage = story?.displayMetadata.heroImageUrl;
  return {
    image: articleImage ?? topicVisuals[topic].image,
    fallbackImage: topicVisuals[topic].image,
    fallbackAlt: topicVisuals[topic].alt,
    alt: story ? `${topicLabel(story.topic)} story image for ${story.headline}` : topicVisuals.general.alt,
    source: articleImage ? "article" as const : "fallback" as const,
  };
}

type StoryVisual = ReturnType<typeof storyVisual>;

function hostname(value?: string | null) {
  if (!value) {
    return null;
  }
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function storySourceTrail(story?: StoryPackage) {
  if (story?.displayMetadata.sourceTrail?.length) {
    return story.displayMetadata.sourceTrail;
  }
  return story?.sources.map((source) => ({
    sourceName: source.name,
    articleUrl: source.url,
    publishedAt: story.updatedAt,
    providerId: "unknown",
    discoveryProvider: null,
    feedUrl: null,
    originalUrl: null,
    linkResolutionStatus: null,
    imageUrl: story.displayMetadata.heroImageUrl,
  })) ?? [];
}

function imageProvenanceLabel(story?: StoryPackage) {
  const provenance = story?.displayMetadata.imageProvenance;
  if (provenance?.status === "article") {
    return provenance.sourceName ? `Article image from ${provenance.sourceName}` : "Article image";
  }
  if (story?.displayMetadata.heroImageUrl) {
    return "Article image";
  }
  return "Topic visual fallback";
}

function freshnessLabel(story?: StoryPackage) {
  return story?.displayMetadata.freshness?.label ?? "Past 48h";
}

function freshnessTone(story?: StoryPackage) {
  const bucket = story?.displayMetadata.freshness?.bucket;
  if (bucket === "live") {
    return "border-emerald-300/25 bg-emerald-300/12 text-emerald-100";
  }
  if (bucket === "today") {
    return "border-sky-300/25 bg-sky-300/12 text-sky-100";
  }
  return "border-amber-300/25 bg-amber-300/12 text-amber-100";
}

function StoryVisualImage({
  visual,
  priority = false,
  sizes,
  className,
}: {
  visual: StoryVisual;
  priority?: boolean;
  sizes: string;
  className: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  if (visual.source === "article" && !imageFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={visual.image}
        alt={visual.alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        referrerPolicy="no-referrer"
        onError={() => setImageFailed(true)}
        className={cn("absolute inset-0 h-full w-full", className)}
      />
    );
  }

  return (
    <Image
      src={visual.fallbackImage}
      alt={visual.source === "article" ? visual.fallbackAlt : visual.alt}
      fill
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      sizes={sizes}
      className={className}
    />
  );
}

function FallbackVisualOverlay({ story, compact = false }: { story?: StoryPackage; compact?: boolean }) {
  const topic = story?.topic ?? "general";
  const metadata = topicVisualMetadata[topic];
  const Icon = metadata.icon;

  if (compact) {
    return (
      <div className="absolute inset-0 flex items-end justify-start bg-[linear-gradient(135deg,rgba(15,23,42,0.1),rgba(15,23,42,0.68))] p-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-slate-950/55 text-white backdrop-blur">
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.12)_0%,rgba(15,23,42,0.52)_56%,rgba(15,23,42,0.88)_100%)]">
      <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
      <div className="absolute left-5 top-16 flex items-center gap-3 rounded-full border border-white/15 bg-slate-950/45 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white backdrop-blur">
        <Icon className="h-4 w-4 text-sky-200" />
        {metadata.signal}
      </div>
      <div className="absolute bottom-20 right-5 hidden max-w-[240px] text-right sm:block">
        <p className="font-display text-xl font-semibold leading-tight text-white">{metadata.visualLabel}</p>
        <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-300">Fallback visual</p>
      </div>
      <div className="absolute inset-x-6 bottom-16 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
    </div>
  );
}

function narrationSeconds(story?: StoryPackage) {
  const words = story?.narration.split(/\s+/).filter(Boolean).length ?? 35;
  return Math.max(12, Math.min(35, Math.round(words / 2.6)));
}

function nextStoryIndex(current: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return (current + 1) % total;
}

function previousStoryIndex(current: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return (current - 1 + total) % total;
}

function whyItMatters(story?: StoryPackage) {
  if (!story) {
    return "The briefing will explain why the lead story matters once the feed is ready.";
  }
  if (story.displayMetadata.whyItMatters) {
    return story.displayMetadata.whyItMatters;
  }
  if (story.confidence === "multi_source") {
    return "Multiple sources are converging on this story, which makes it a stronger candidate for the lead briefing.";
  }
  if (story.topic === "technology") {
    return "Technology shifts can quickly affect markets, policy, privacy, and daily tools people rely on.";
  }
  if (story.topic === "business") {
    return "Business stories can signal changes in costs, jobs, markets, and consumer behavior.";
  }
  if (story.topic === "health") {
    return "Health coverage can affect personal decisions, public policy, and institutional readiness.";
  }
  if (story.topic === "politics") {
    return "Political developments can change policy direction, civic priorities, and institutional trust.";
  }
  return "This story is recent, source-backed, and relevant to the current briefing mix.";
}

export function HeadlineFlowClient() {
  const [feed, setFeed] = useState<HeadlineFlowFeed>(fallbackFeed);
  const [providerDiagnostics, setProviderDiagnostics] = useState<ProviderDiagnostics>(fallbackProviderDiagnostics);
  const [topic, setTopic] = useState<HeadlineFlowTopic | "all">("all");
  const [providerMode, setProviderMode] = useState<ProviderMode>("auto");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [activeRailView, setActiveRailView] = useState<RailView>("flow");
  const [showFullQueue, setShowFullQueue] = useState(false);
  const [showStoryDetail, setShowStoryDetail] = useState(false);
  const [detailMode, setDetailMode] = useState<DetailMode>("overview");
  const [eventDetail, setEventDetail] = useState<HeadlineFlowEventRecord | null>(null);
  const [eventDetailStatus, setEventDetailStatus] = useState<"idle" | "loading" | "error">("idle");
  const [eventDetailMessage, setEventDetailMessage] = useState("");
  const [eventActionStatus, setEventActionStatus] = useState<"idle" | "loading" | "error">("idle");
  const [eventActionMessage, setEventActionMessage] = useState("");
  const [eventLibrary, setEventLibrary] = useState<Array<{ event: HeadlineFlowEventRecord; preference: EventPreferenceSummary }>>([]);
  const [eventLibraryFilter, setEventLibraryFilter] = useState<EventLibraryFilter>("saved");
  const [eventLibraryStatus, setEventLibraryStatus] = useState<"idle" | "loading" | "error">("idle");
  const [eventLibraryMessage, setEventLibraryMessage] = useState("");
  const [interactionSummary, setInteractionSummary] = useState<InteractionWindowedSummary | null>(null);
  const [interactionWindow, setInteractionWindow] = useState<InteractionSummaryWindow>("24h");
  const [readiness, setReadiness] = useState<HeadlineFlowReadiness | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackProgress, setPlaybackProgress] = useState(38);

  const recordInteraction = useCallback(async (input: {
    action: string;
    story?: StoryPackage;
    eventId?: string;
    topic?: HeadlineFlowTopic;
    sourceName?: string;
    metadata?: Record<string, string | number | boolean | null>;
  }) => {
    try {
      const response = await fetch("/api/headline-flow/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: input.action,
          eventId: input.eventId ?? input.story?.eventId ?? null,
          storyId: input.story?.id ?? null,
          topic: input.topic ?? input.story?.topic ?? null,
          providerId: feed.providerId,
          sourceName: input.sourceName ?? input.story?.sources[0]?.name ?? null,
          metadata: input.metadata,
        }),
      });
      const payload = (await response.json()) as InteractionApiResponse;
      if (response.ok && payload.ok === true) {
        setInteractionSummary(payload.data.summary);
      }
    } catch {
      // Interaction analytics must never block the briefing experience.
    }
  }, [feed.providerId]);

  const requestFeed = useCallback(async () => {
    const params = new URLSearchParams({ limit: "12" });
    if (topic !== "all") {
      params.set("topic", topic);
    }
    params.set("provider", providerMode);
    const response = await fetch(`/api/headline-flow/feed?${params.toString()}`, { cache: "no-store" });
    const payload = (await response.json()) as ApiResponse;
    if (!response.ok || payload.ok !== true) {
      const errorMessage = payload.ok === false ? payload.error?.message : undefined;
      throw new Error(errorMessage || "Unable to load Headline Flow.");
    }
    return payload.data;
  }, [providerMode, topic]);

  const loadReadiness = useCallback(async () => {
    try {
      const response = await fetch("/api/headline-flow/readiness", { cache: "no-store" });
      const payload = (await response.json()) as ReadinessApiResponse;
      if (response.ok && payload.ok === true) {
        setReadiness(payload.data.readiness);
      }
    } catch {
      setReadiness(null);
    }
  }, []);

  const loadFeed = useCallback(async () => {
    setStatus("loading");
    setMessage("");
    try {
      const payload = await requestFeed();
      const nextFeed = payload.feed;
      setFeed(nextFeed);
      setActiveStoryIndex(0);
      setPlaybackProgress(0);
      setProviderDiagnostics(payload.diagnostics);
      setStatus("idle");
      setMessage(`Loaded ${nextFeed.diagnostics.storyCount} story package${nextFeed.diagnostics.storyCount === 1 ? "" : "s"}.`);
      void loadReadiness();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to load Headline Flow.");
    }
  }, [loadReadiness, requestFeed]);

  const loadEventLibrary = useCallback(async () => {
    setEventLibraryStatus("loading");
    setEventLibraryMessage("");
    try {
      const response = await fetch("/api/headline-flow/events/preferences", { cache: "no-store" });
      const payload = (await response.json()) as EventPreferencesApiResponse;
      if (!response.ok || payload.ok !== true) {
        const errorMessage = payload.ok === false ? payload.error?.message : undefined;
        throw new Error(errorMessage || "Unable to load event library.");
      }
      setEventLibrary(payload.data.events);
      setEventLibraryStatus("idle");
      setEventLibraryMessage(`Loaded ${payload.data.events.length} event preference${payload.data.events.length === 1 ? "" : "s"}.`);
    } catch (error) {
      setEventLibraryStatus("error");
      setEventLibraryMessage(error instanceof Error ? error.message : "Unable to load event library.");
    }
  }, []);

  const loadInteractionSummary = useCallback(async () => {
    try {
      const response = await fetch("/api/headline-flow/interactions", { cache: "no-store" });
      const payload = (await response.json()) as InteractionApiResponse;
      if (response.ok && payload.ok === true) {
        setInteractionSummary(payload.data.summary);
      }
    } catch {
      // Diagnostics analytics are opportunistic.
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialFeed() {
      try {
        const payload = await requestFeed();
        if (!active) {
          return;
        }
        const nextFeed = payload.feed;
        setFeed(nextFeed);
        setActiveStoryIndex(0);
        setPlaybackProgress(0);
        setProviderDiagnostics(payload.diagnostics);
        setStatus("idle");
        setMessage(`Loaded ${nextFeed.diagnostics.storyCount} story package${nextFeed.diagnostics.storyCount === 1 ? "" : "s"}.`);
        void loadReadiness();
      } catch (error) {
        if (!active) {
          return;
        }
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Unable to load Headline Flow.");
      }
    }

    void loadInitialFeed();

    return () => {
      active = false;
    };
  }, [loadReadiness, requestFeed]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    const interval = window.setInterval(() => {
      setPlaybackProgress((current) => (current >= 100 ? 100 : current + 4));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isPlaying, activeStoryIndex]);

  useEffect(() => {
    if (playbackProgress < 100 || feed.stories.length <= 1) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setPlaybackProgress(0);
      setActiveStoryIndex((current) => nextStoryIndex(current, feed.stories.length));
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [feed.stories.length, playbackProgress]);

  const topStory = feed.stories[activeStoryIndex] ?? feed.stories[0];
  const queueStories = useMemo(() => {
    if (feed.stories.length <= 1) {
      return [];
    }
    return Array.from({ length: Math.min(5, feed.stories.length - 1) }, (_, offset) => {
      const index = nextStoryIndex(activeStoryIndex + offset, feed.stories.length);
      return { story: feed.stories[index], index };
    }).filter((item): item is { story: StoryPackage; index: number } => Boolean(item.story));
  }, [activeStoryIndex, feed.stories]);
  const savedStories = useMemo(
    () => feed.stories.map((story, index) => ({ story, index })).filter(({ story }) => story.userPreference?.saved),
    [feed.stories],
  );
  const filteredEventLibrary = useMemo(
    () => eventLibrary.filter((item) => item.preference[eventLibraryFilter]),
    [eventLibrary, eventLibraryFilter],
  );
  const diagnostics = feed.diagnostics;
  const topicCoverage = providerDiagnostics.provider?.topicCoverage;
  const linkResolution = providerDiagnostics.provider?.linkResolution;
  const imageExtraction = providerDiagnostics.provider?.imageExtraction;
  const activeStoryOrdinal = diagnostics.storyCount ? activeStoryIndex + 1 : 0;
  const hasWarning = Boolean(providerDiagnostics.fallbackReason || providerDiagnostics.providerError || providerDiagnostics.provider?.error);
  const topNarrationSeconds = narrationSeconds(topStory);
  const topStorySaved = Boolean(topStory?.userPreference?.saved);
  const activeEventDetail = eventDetail?.id === topStory?.eventId ? eventDetail : null;
  const selectableProviderOptions = providerOptions.filter((option) => option.value !== "fixture" || readiness?.checks.fixtureFallback.status === "enabled");

  useEffect(() => {
    if (!showStoryDetail || !topStory?.eventId || topStory.eventId === "fallback-event") {
      return;
    }

    let active = true;
    async function loadEventDetail() {
      setEventDetailStatus("loading");
      setEventDetailMessage("");
      try {
        const response = await fetch(`/api/headline-flow/events/${encodeURIComponent(topStory.eventId)}`, { cache: "no-store" });
        const payload = (await response.json()) as EventApiResponse;
        if (!response.ok || payload.ok !== true) {
          const errorMessage = payload.ok === false ? payload.error?.message : undefined;
          throw new Error(errorMessage || "Unable to load event history.");
        }
        if (!active) {
          return;
        }
        setEventDetail(payload.data.event);
        setFeed((current) => ({
          ...current,
          stories: current.stories.map((story) =>
            story.eventId === payload.data.event.id
              ? {
                  ...story,
                  userPreference: payload.data.preference,
                }
              : story,
          ),
        }));
        setEventDetailStatus("idle");
      } catch (error) {
        if (!active) {
          return;
        }
        setEventDetail(null);
        setEventDetailStatus("error");
        setEventDetailMessage(error instanceof Error ? error.message : "Unable to load event history.");
      }
    }

    void loadEventDetail();

    return () => {
      active = false;
    };
  }, [showStoryDetail, topStory?.eventId]);

  const selectStory = useCallback((index: number) => {
    const story = feed.stories[index];
    setActiveStoryIndex(index);
    setPlaybackProgress(0);
    setActiveRailView("flow");
    setShowFullQueue(false);
    if (story) {
      void recordInteraction({ action: "story_opened", story, metadata: { selectedRank: index + 1 } });
    }
  }, [feed.stories, recordInteraction]);

  const goToNextStory = useCallback(() => {
    setPlaybackProgress(0);
    setActiveStoryIndex((current) => {
      const nextIndex = nextStoryIndex(current, feed.stories.length);
      const story = feed.stories[nextIndex];
      if (story) {
        void recordInteraction({ action: "next_story", story, metadata: { selectedRank: nextIndex + 1 } });
      }
      return nextIndex;
    });
  }, [feed.stories, recordInteraction]);

  const goToPreviousStory = useCallback(() => {
    setPlaybackProgress(0);
    setActiveStoryIndex((current) => {
      const previousIndex = previousStoryIndex(current, feed.stories.length);
      const story = feed.stories[previousIndex];
      if (story) {
        void recordInteraction({ action: "previous_story", story, metadata: { selectedRank: previousIndex + 1 } });
      }
      return previousIndex;
    });
  }, [feed.stories, recordInteraction]);

  const openStoryDetail = useCallback((mode: DetailMode) => {
    setDetailMode(mode);
    setEventActionStatus("idle");
    setEventActionMessage("");
    setShowStoryDetail(true);
    setActiveRailView(mode === "diagnostics" ? "settings" : "brief");
    if (topStory) {
      void recordInteraction({ action: "story_opened", story: topStory, metadata: { detailMode: mode } });
    }
    if (mode === "diagnostics") {
      void loadInteractionSummary();
    }
  }, [loadInteractionSummary, recordInteraction, topStory]);

  const applyEventAction = useCallback(async (
    action: "save" | "unsave" | "mute" | "unmute" | "resolve" | "restore",
    eventId = topStory?.eventId,
  ) => {
    if (!eventId) {
      return;
    }
    setEventActionStatus("loading");
    setEventActionMessage("");
    try {
      const response = await fetch(`/api/headline-flow/events/${encodeURIComponent(eventId)}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = (await response.json()) as EventActionApiResponse;
      if (!response.ok || payload.ok !== true) {
        const errorMessage = payload.ok === false ? payload.error?.message : undefined;
        throw new Error(errorMessage || "Unable to update event.");
      }
      setFeed((current) => ({
        ...current,
        stories: current.stories.map((story) =>
          story.eventId === payload.data.eventId
            ? {
                ...story,
                userPreference: payload.data.preference,
              }
            : story,
        ),
      }));
      setEventLibrary((current) =>
        current.map((item) =>
          item.event.id === payload.data.eventId
            ? {
                ...item,
                preference: payload.data.preference,
              }
            : item,
        ),
      );
      setEventActionStatus("idle");
      setEventActionMessage("Event preference updated.");
      const actedStory = feed.stories.find((story) => story.eventId === payload.data.eventId);
      void recordInteraction({ action, story: actedStory, eventId: payload.data.eventId });
      if (activeRailView === "saved") {
        void loadEventLibrary();
      }
      if (action === "mute" || action === "resolve") {
        setShowStoryDetail(false);
        await loadFeed();
      }
    } catch (error) {
      setEventActionStatus("error");
      setEventActionMessage(error instanceof Error ? error.message : "Unable to update event.");
    }
  }, [activeRailView, feed.stories, loadEventLibrary, loadFeed, recordInteraction, topStory?.eventId]);

  const toggleStoryEventSave = useCallback((story?: StoryPackage) => {
    if (!story) {
      return;
    }
    void applyEventAction(story.userPreference?.saved ? "unsave" : "save", story.eventId);
  }, [applyEventAction]);

  const handleRailSelect = useCallback((view: RailView) => {
    setActiveRailView(view);
    if (view === "saved") {
      void loadEventLibrary();
    }
    if (view === "brief") {
      openStoryDetail("overview");
    }
    if (view === "settings") {
      openStoryDetail("diagnostics");
    }
  }, [loadEventLibrary, openStoryDetail]);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[22px] border border-white/10 bg-slate-950 shadow-[0_26px_80px_rgba(0,0,0,0.42)] sm:rounded-[24px] xl:h-[calc(100vh-4rem)] xl:min-h-[720px]">
      <a
        href="#headline-flow-current-story"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("headline-flow-current-story")?.focus();
          window.history.replaceState(null, "", "#headline-flow-current-story");
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:border focus:border-sky-300/40 focus:bg-slate-950 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to current story
      </a>
      <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[190px_minmax(0,1fr)_340px] 2xl:grid-cols-[210px_minmax(0,1fr)_380px]">
        <aside className="flex min-h-0 flex-col border-b border-white/10 bg-black/25 p-4 xl:border-b-0 xl:border-r" aria-label="Headline Flow controls">
          <div className="hidden py-3 xl:block">
            <p className="font-display text-2xl font-semibold tracking-[0.18em] text-white">HEADLINE FLOW</p>
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">AI-powered briefing</p>
          </div>

          <nav className="mt-2 flex flex-wrap gap-2 xl:mt-8 xl:grid xl:gap-3" aria-label="Headline Flow views">
            {railItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleRailSelect(item.value)}
                  aria-current={activeRailView === item.value ? "page" : undefined}
                  className={cn(
                    "flex min-w-0 flex-1 basis-[calc(50%-0.25rem)] items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] transition sm:flex-none sm:basis-auto xl:flex-1",
                    activeRailView === item.value
                      ? "border-sky-300/25 bg-sky-400/15 text-white shadow-[inset_3px_0_0_rgba(56,189,248,0.95)]"
                      : "border-transparent bg-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-200",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-center xl:mt-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Voice Ready</p>
            <div className="mx-auto mt-5 flex h-12 max-w-[150px] items-end justify-center gap-1 text-emerald-400">
              {Array.from({ length: 18 }).map((_, index) => (
                <span
                  key={index}
                  className="w-1 rounded-full bg-emerald-400/80"
                  style={{ height: `${12 + ((index * 7) % 28)}px` }}
                />
              ))}
            </div>
            <p className="mt-5 text-sm leading-5 text-slate-400">&quot;Axiom, catch me up.&quot;</p>
          </div>
        </aside>

        <section
          id="headline-flow-current-story"
          tabIndex={-1}
          className="min-h-0 min-w-0 overflow-y-auto border-b border-white/10 outline-none xl:border-b-0 xl:border-r"
          aria-label="Current briefing story"
        >
          <div className="flex flex-col gap-4 border-b border-white/10 bg-slate-950/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.26em] text-sky-200">Headline Flow</p>
              <p className="mt-1 text-sm text-slate-500">AI-powered news briefing</p>
            </div>
            <div className="text-left sm:text-center">
              <p suppressHydrationWarning className="font-display text-3xl font-semibold text-white sm:text-4xl">{formatTimestamp(now)}</p>
              <p suppressHydrationWarning className="mt-1 text-sm text-slate-400">{formatDate(now)}</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
              <CloudSun className="h-8 w-8 text-amber-200" />
              <div>
                <p className="text-lg font-semibold text-white">72°F</p>
                <p className="text-xs text-slate-400">Partly Cloudy</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 lg:p-6">
            <div
              className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-3">
                <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-full border", readinessTone(readiness))}>
                  {readiness?.status === "ready" ? <ShieldCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{readinessLabel(readiness)}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {readiness?.summary ?? "Checking provider configuration and feed quality."}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">RSS {readiness?.checks.rss.status ?? "..."}</span>
                <span className={cn(
                  "rounded-full border px-3 py-2",
                  readiness?.checks.webSearch.ok
                    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                    : "border-amber-300/20 bg-amber-300/10 text-amber-100",
                )}>
                  Search {readiness?.checks.webSearch.status === "configured" ? "on" : "off"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  {readiness?.checks.feed.topicCount ?? 0}/{readiness?.checks.feed.minReadyTopics ?? 0} topics
                </span>
              </div>
            </div>
            <HeroStory
              story={topStory}
              index={activeStoryOrdinal}
              total={diagnostics.storyCount}
              saved={topStorySaved}
              onSourceOpen={(story, sourceName) => void recordInteraction({ action: "source_opened", story, sourceName })}
            />
            <WhatChangedStrip story={topStory} />

            <div className="mt-5 rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-sky-300" />
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-300">AI Summary</p>
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-500">({topNarrationSeconds} seconds)</span>
                </div>
                <Radio className="h-5 w-5 text-slate-400" />
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-200 sm:text-base">
                {topStory?.narration ?? "The next briefing summary will appear once stories are loaded."}
              </p>
              <div className="mt-5 rounded-2xl border border-sky-300/15 bg-sky-300/8 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Why it matters</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{whyItMatters(topStory)}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={goToPreviousStory}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                aria-label="Previous story"
              >
                <SkipBack className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsPlaying((current) => !current)}
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-sky-300/50 bg-sky-400/15 text-white shadow-[0_0_32px_rgba(56,189,248,0.28)]"
                aria-label={isPlaying ? "Pause narration" : "Play narration"}
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
              </button>
              <button
                type="button"
                onClick={goToNextStory}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                aria-label="Next story"
              >
                <SkipForward className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-sky-300">
                    Story {activeStoryOrdinal || 1} of {diagnostics.storyCount || 1}
                  </span>
                  <span className="text-slate-400">
                    0:{String(Math.round((playbackProgress / 100) * topNarrationSeconds)).padStart(2, "0")} / 0:{String(topNarrationSeconds).padStart(2, "0")}
                  </span>
                </div>
                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
                  role="progressbar"
                  aria-label="Narration progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(playbackProgress)}
                >
                  <div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${playbackProgress}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-sky-300">
                <Mic className="h-4 w-4" />
                Say &quot;Axiom&quot; + command
              </span>
              <button type="button" onClick={goToNextStory} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                Next story
              </button>
              <button type="button" onClick={() => openStoryDetail("timeline")} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                Tell me more
              </button>
              <button type="button" onClick={() => openStoryDetail("why")} className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-2 text-xs text-sky-200">
                Why is this important?
              </button>
              <button
                type="button"
                onClick={() => toggleStoryEventSave(topStory)}
                disabled={eventActionStatus === "loading"}
                className={cn(
                  "rounded-full border px-3 py-2 text-xs",
                  topStorySaved ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300",
                )}
              >
                {topStorySaved ? "Saved" : "Save this"}
              </button>
            </div>
          </div>
        </section>

        <aside className="min-h-0 overflow-y-auto bg-black/20 p-4 sm:p-5 xl:p-6" aria-label="Briefing queue and filters">
          <div data-testid="headline-flow-queue" className="rounded-[22px] border border-white/10 bg-slate-900/55 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-sky-300">Up Next</p>
              <p className="text-sm text-slate-400">{diagnostics.storyCount} stories in your briefing</p>
            </div>
            <div className="mt-5 grid max-h-[min(430px,48vh)] gap-3 overflow-y-auto pr-1">
              {queueStories.map(({ story, index }) => (
                <QueueStory
                  key={story.id}
                  story={story}
                  index={index + 1}
                  active={index === activeStoryIndex}
                  saved={Boolean(story.userPreference?.saved)}
                  onSelect={() => selectStory(index)}
                  onToggleSaved={() => toggleStoryEventSave(story)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowFullQueue((current) => !current)}
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-sm font-semibold text-slate-100 transition hover:bg-white/15"
            >
              {showFullQueue ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
              {showFullQueue ? "Close Briefing Queue" : "View Full Briefing Queue"}
            </button>
          </div>

          {showFullQueue || activeRailView === "saved" ? (
            <StoryPanel
              title={activeRailView === "saved" ? "Saved Stories" : "Full Briefing Queue"}
              emptyText={activeRailView === "saved" ? "Saved stories will appear here." : "No stories are available yet."}
              stories={activeRailView === "saved" ? savedStories : feed.stories.map((story, index) => ({ story, index }))}
              activeIndex={activeStoryIndex}
              onSelect={selectStory}
              onToggleSaved={toggleStoryEventSave}
              onOpenDetail={(mode) => openStoryDetail(mode)}
            />
          ) : null}
          {activeRailView === "saved" ? (
            <EventLibraryPanel
              filter={eventLibraryFilter}
              events={filteredEventLibrary}
              status={eventLibraryStatus}
              message={eventLibraryMessage}
              onFilterChange={setEventLibraryFilter}
              onRefresh={() => void loadEventLibrary()}
              onAction={(eventId, action) => void applyEventAction(action, eventId)}
            />
          ) : null}

          <div className="mt-4 rounded-[22px] border border-white/10 bg-slate-900/45 p-4 sm:p-5">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Controls</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {selectableProviderOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setProviderMode(option.value)}
                  aria-pressed={providerMode === option.value}
                  className={cn(
                    "rounded-2xl border px-3 py-2 text-sm transition",
                    providerMode === option.value
                      ? "border-sky-300/30 bg-sky-300/15 text-sky-50"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {topicOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={topic === option.value}
                  onClick={() => {
                    setTopic(option.value);
                    setActiveRailView("topics");
                    if (option.value !== "all") {
                      void recordInteraction({ action: "topic_filter_selected", topic: option.value, metadata: { label: option.label } });
                    }
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition",
                    topic === option.value
                      ? "border-white bg-white text-slate-950"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                void loadFeed();
                void loadReadiness();
              }}
              disabled={status === "loading"}
              aria-busy={status === "loading"}
              className="mt-4 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
            >
              {status === "loading" ? "Refreshing" : "Refresh briefing"}
              <RefreshCw className={cn("h-4 w-4", status === "loading" ? "animate-spin" : "")} />
            </button>
            <p className={cn("mt-3 text-sm leading-6", status === "error" ? "text-rose-200" : "text-slate-400")} role="status" aria-live="polite">
              {message || "Loading the latest feed package..."}
            </p>
            {providerMode !== "rss" && readiness?.checks.webSearch.status === "missing_configuration" ? (
              <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-50">
                OpenAI web search is optional and currently off. RSS mode remains live; add `OPENAI_API_KEY` only to enable search-enhanced recovery.
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      <footer className="grid gap-3 border-t border-white/10 bg-black/20 px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:px-5 md:grid-cols-2 xl:grid-cols-5">
        <StatusItem icon={ShieldCheck} text={hasWarning ? "Diagnostics need review" : "Sources verified"} tone={hasWarning ? "text-amber-300" : "text-emerald-300"} />
        <StatusItem icon={Sparkles} text={`Personalized ${providerLabel(providerDiagnostics.selectedProvider)}`} tone="text-sky-300" />
        <StatusItem icon={Volume2} text={isPlaying ? "Narration on" : "Narration paused"} tone="text-sky-300" />
        <StatusItem
          icon={Images}
          text={`Images ${imageExtraction?.found ?? 0} found`}
          tone={(imageExtraction?.found ?? 0) > 0 ? "text-emerald-300" : "text-slate-300"}
        />
        <StatusItem
          icon={Wifi}
          text={`Cache ${providerDiagnostics.cache?.status ?? "unknown"} · ${topicCoverage?.fulfilledTopics.length ?? 0}/${topicCoverage?.attemptedTopics.length ?? 0} topics`}
          tone="text-slate-300"
        />
      </footer>

      <div className="sr-only">
        {linkResolution ? `Used ${linkResolution.direct} direct publisher links.` : null}
      </div>
      {showStoryDetail && topStory ? (
        <StoryDetailDrawer
          story={topStory}
          storyIndex={activeStoryOrdinal}
          storyTotal={diagnostics.storyCount}
          mode={detailMode}
          providerDiagnostics={providerDiagnostics}
          feedDiagnostics={diagnostics}
          interactionSummary={interactionSummary}
          interactionWindow={interactionWindow}
          eventDetail={activeEventDetail}
          eventDetailStatus={eventDetailStatus}
          eventDetailMessage={eventDetailMessage}
          eventActionStatus={eventActionStatus}
          eventActionMessage={eventActionMessage}
          onModeChange={setDetailMode}
          onInteractionWindowChange={setInteractionWindow}
          onClose={() => {
            setShowStoryDetail(false);
            setActiveRailView("flow");
          }}
          onToggleSaved={() => toggleStoryEventSave(topStory)}
          onEventAction={applyEventAction}
          saved={topStorySaved}
        />
      ) : null}
    </div>
  );
}

function HeroStory({
  story,
  index,
  total,
  saved,
  onSourceOpen,
}: {
  story?: StoryPackage;
  index: number;
  total: number;
  saved: boolean;
  onSourceOpen: (story: StoryPackage, sourceName: string) => void;
}) {
  const topic = story?.topic ?? "general";
  const visual = storyVisual(story);
  const articleCount = story?.displayMetadata.articleCount ?? 0;
  const sourceTrail = storySourceTrail(story);
  const leadTrail = sourceTrail[0];
  const leadHost = hostname(leadTrail?.articleUrl);
  return (
    <div className="grid gap-5 2xl:grid-cols-[1.08fr_0.92fr]">
      <div
        data-testid="headline-flow-hero-visual"
        className={cn("relative min-h-[260px] overflow-hidden rounded-[22px] bg-gradient-to-br sm:min-h-[360px] 2xl:min-h-[430px]", topicAccents[topic])}
      >
        <StoryVisualImage visual={visual} priority sizes="(min-width: 1280px) 34vw, 100vw" className="object-cover" />
        {visual.source === "fallback" ? <FallbackVisualOverlay story={story} /> : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.1)_0%,rgba(2,6,23,0.48)_62%,rgba(2,6,23,0.86)_100%),linear-gradient(180deg,rgba(2,6,23,0)_40%,rgba(2,6,23,0.82)_100%)]" />
        <div className="absolute left-5 top-5 rounded-full bg-sky-500 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white">
          {topicLabel(topic)}
        </div>
        <div className={cn("absolute left-5 top-16 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] backdrop-blur", freshnessTone(story))}>
          {freshnessLabel(story)}
        </div>
        <div className="absolute right-5 top-5 max-w-[60%] truncate rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          {imageProvenanceLabel(story)}
        </div>
        <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {story?.sources[0]?.name ?? "Headline Flow"}
          </span>
          <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {articleCount || 1} article{articleCount === 1 ? "" : "s"}
          </span>
          {leadHost ? (
            <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              {leadHost}
            </span>
          ) : null}
          {saved ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/25 bg-emerald-300/15 px-3 py-1 text-xs font-semibold text-emerald-100 backdrop-blur">
              <BookmarkCheck className="h-3 w-3" />
              Saved
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-col justify-center 2xl:min-h-[430px]">
        <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl 2xl:text-[44px]">
          {story?.headline ?? "No article packages available"}
        </h2>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
          {story?.shortSummary ?? "Try another topic or refresh the feed."}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <span className="font-semibold text-slate-200">{story?.sources[0]?.name ?? "Headline Flow"}</span>
          <span>•</span>
          <span>{story ? formatTimestamp(story.updatedAt) : "Waiting"}</span>
          <span>•</span>
          <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]", freshnessTone(story))}>
            {freshnessLabel(story)}
          </span>
          <span>•</span>
          <span>{story?.sourceCount ?? 1} verified source{story?.sourceCount === 1 ? "" : "s"}</span>
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-200">
            {story?.importance === "breaking" ? "Breaking" : "High importance"}
          </span>
        </div>
        {story ? (
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <StoryStat label="Topic" value={topicLabel(story.topic)} />
            <StoryStat label="Freshness" value={freshnessLabel(story)} />
            <StoryStat label="Confidence" value={story.confidence === "multi_source" ? "Multi source" : "Single source"} />
            <StoryStat label="Priority" value={`${story.displayMetadata.briefingScore}/100`} />
          </div>
        ) : null}
        {story?.displayMetadata.prioritySignals.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {story.displayMetadata.prioritySignals.map((signal) => (
              <span key={signal} className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs font-semibold text-slate-300">
                {signal}
              </span>
            ))}
          </div>
        ) : null}
        {story?.displayMetadata.personalizationReason ? (
          <p className="mt-3 text-sm font-medium text-sky-200">{story.displayMetadata.personalizationReason}</p>
        ) : null}
        {story ? <SourceLinks story={story} onSourceOpen={(sourceName) => onSourceOpen(story, sourceName)} /> : null}
        {story ? <ArticleTrailPreview story={story} /> : null}
        <p className="mt-5 text-sm font-medium text-slate-500">
          Story {index} of {total || 1}
        </p>
      </div>
    </div>
  );
}

function ArticleTrailPreview({ story }: { story: StoryPackage }) {
  const trail = storySourceTrail(story).slice(0, 3);
  if (!trail.length) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {trail.map((item, index) => {
        const host = hostname(item.articleUrl);
        return (
          <span key={`${item.articleUrl ?? item.sourceName}-${index}`} className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs font-semibold text-slate-300">
            {item.sourceName}
            {host ? ` · ${host}` : ""}
            {item.linkResolutionStatus === "resolved" ? " · resolved" : ""}
          </span>
        );
      })}
    </div>
  );
}

function QueueStory({
  story,
  index,
  active,
  saved,
  onSelect,
  onToggleSaved,
}: {
  story: StoryPackage;
  index: number;
  active: boolean;
  saved: boolean;
  onSelect: () => void;
  onToggleSaved: () => void;
}) {
  const visual = storyVisual(story);
  const hasArticleImage = story.displayMetadata.imageProvenance?.status === "article" || Boolean(story.displayMetadata.heroImageUrl);
  const selectLabel = `Select story ${index}: ${story.headline}`;
  return (
    <div
      className={cn(
        "grid w-full grid-cols-[76px_1fr_28px] gap-3 border-b border-white/10 pb-3 text-left transition last:border-b-0 last:pb-0 sm:grid-cols-[96px_1fr_28px] sm:gap-4",
        active ? "rounded-2xl border-b-0 bg-sky-300/10 p-2" : "",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn("relative h-16 overflow-hidden rounded-2xl bg-gradient-to-br sm:h-20", topicAccents[story.topic])}
        aria-label={selectLabel}
        aria-current={active ? "true" : undefined}
      >
        <StoryVisualImage visual={visual} sizes="96px" className="object-cover" />
        <span className="absolute inset-0 bg-black/28" />
        {visual.source === "fallback" ? <FallbackVisualOverlay story={story} compact /> : null}
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_65%_35%,rgba(255,255,255,0.28),transparent_28%),linear-gradient(160deg,transparent,rgba(0,0,0,0.48))]" />
        <span className="absolute left-2 top-2 rounded-full bg-slate-950/50 px-2 py-0.5 text-xs font-semibold text-white">{index}</span>
        <span className="absolute bottom-2 right-2 rounded-full bg-slate-950/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
          {hasArticleImage ? "Article" : "Topic"}
        </span>
      </button>
      <button type="button" onClick={onSelect} className="min-w-0 text-left" aria-label={selectLabel} aria-current={active ? "true" : undefined}>
        <span className={cn("block text-xs font-bold uppercase tracking-[0.12em]", topicTone(story.topic))}>{topicLabel(story.topic)}</span>
        <span className="mt-1 block line-clamp-2 text-sm font-semibold leading-5 text-white">{story.headline}</span>
        <span className="mt-1 block text-xs text-slate-500">
          {story.sources[0]?.name ?? "Source"} · {formatTimestamp(story.updatedAt)} · {freshnessLabel(story)}
        </span>
      </button>
      <button
        type="button"
        onClick={onToggleSaved}
        className={cn(
          "mt-1 flex h-7 w-7 items-center justify-center rounded-full border",
          saved ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-200" : "border-white/10 bg-white/5 text-slate-400",
        )}
        aria-label={saved ? "Remove saved story" : "Save story"}
      >
        {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      </button>
    </div>
  );
}

function StoryPanel({
  title,
  emptyText,
  stories,
  activeIndex,
  onSelect,
  onToggleSaved,
  onOpenDetail,
}: {
  title: string;
  emptyText: string;
  stories: Array<{ story: StoryPackage; index: number }>;
  activeIndex: number;
  onSelect: (index: number) => void;
  onToggleSaved: (story: StoryPackage) => void;
  onOpenDetail: (mode: DetailMode) => void;
}) {
  return (
    <div className="mt-4 rounded-3xl border border-white/10 bg-slate-900/45 p-4 sm:p-5">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <div className="mt-4 max-h-[min(360px,55vh)] overflow-y-auto pr-1">
        {stories.length ? (
          <div className="grid gap-2">
            {stories.map(({ story, index }) => (
              <div
                key={story.id}
                className={cn(
                  "grid grid-cols-[1fr_auto] gap-3 rounded-2xl border px-3 py-3 text-left transition",
                  activeIndex === index ? "border-sky-300/30 bg-sky-300/12" : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  className="min-w-0 text-left"
                  aria-label={`Select story ${index + 1}: ${story.headline}`}
                  aria-current={activeIndex === index ? "true" : undefined}
                >
                  <span className={cn("block text-[10px] font-bold uppercase tracking-[0.16em]", topicTone(story.topic))}>
                    {index + 1} · {topicLabel(story.topic)} · {formatTimestamp(story.updatedAt)}
                  </span>
                  <span className="mt-1 block line-clamp-2 text-sm font-semibold leading-5 text-white">{story.headline}</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {story.sources[0]?.name ?? "Source"} · {story.sourceCount} source{story.sourceCount === 1 ? "" : "s"}
                  </span>
                </button>
                <span className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleSaved(story)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border",
                      story.userPreference?.saved ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-200" : "border-white/10 bg-white/5 text-slate-400",
                    )}
                    aria-label={story.userPreference?.saved ? "Remove saved story" : "Save story"}
                  >
                    {story.userPreference?.saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                  </button>
                  {activeIndex === index ? (
                    <button
                      type="button"
                      onClick={() => onOpenDetail("overview")}
                      className="rounded-full border border-sky-300/20 bg-sky-300/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-200"
                    >
                      Detail
                    </button>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-5 text-sm text-slate-400">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

function EventLibraryPanel({
  filter,
  events,
  status,
  message,
  onFilterChange,
  onRefresh,
  onAction,
}: {
  filter: EventLibraryFilter;
  events: Array<{ event: HeadlineFlowEventRecord; preference: EventPreferenceSummary }>;
  status: "idle" | "loading" | "error";
  message: string;
  onFilterChange: (filter: EventLibraryFilter) => void;
  onRefresh: () => void;
  onAction: (eventId: string, action: "save" | "unsave" | "mute" | "unmute" | "resolve" | "restore") => void;
}) {
  const filters: Array<{ label: string; value: EventLibraryFilter }> = [
    { label: "Saved", value: "saved" },
    { label: "Muted", value: "muted" },
    { label: "Resolved", value: "resolved" },
  ];
  const emptyText = filter === "saved"
    ? "Saved events will appear here."
    : filter === "muted"
      ? "Muted events will appear here."
      : "Resolved events will appear here.";

  return (
    <div className="mt-4 rounded-3xl border border-white/10 bg-slate-900/45 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Event Library</p>
        <button
            type="button"
            onClick={onRefresh}
            disabled={status === "loading"}
            aria-busy={status === "loading"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 disabled:opacity-60"
            aria-label="Refresh event library"
        >
          <RefreshCw className={cn("h-4 w-4", status === "loading" ? "animate-spin" : "")} />
        </button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onFilterChange(item.value)}
            aria-pressed={filter === item.value}
            className={cn(
              "rounded-2xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition",
              filter === item.value ? "border-sky-300/30 bg-sky-300/15 text-sky-100" : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className={cn("mt-3 text-sm", status === "error" ? "text-rose-200" : "text-slate-500")}>
        {message || "Review server-backed event preferences."}
      </p>
      <div className="mt-4 max-h-[min(360px,55vh)] overflow-y-auto pr-1">
        {events.length ? (
          <div className="grid gap-2">
            {events.map(({ event, preference }) => (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3">
                <span className={cn("block text-[10px] font-bold uppercase tracking-[0.16em]", topicTone(event.topic))}>
                  {topicLabel(event.topic)} · {formatTimestamp(event.lastUpdatedAt)} · v{event.version}
                </span>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-white">{event.title}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{event.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onAction(event.id, preference.saved ? "unsave" : "save")}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      preference.saved ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
                    )}
                  >
                    {preference.saved ? "Unsave" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onAction(event.id, preference.muted ? "unmute" : "mute")}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      preference.muted ? "border-sky-300/30 bg-sky-300/15 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
                    )}
                  >
                    {preference.muted ? "Unmute" : "Mute"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onAction(event.id, preference.resolved ? "restore" : "resolve")}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      preference.resolved ? "border-sky-300/30 bg-sky-300/15 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
                    )}
                  >
                    {preference.resolved ? "Restore" : "Resolve"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-5 text-sm text-slate-400">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

function StoryDetailDrawer({
  story,
  storyIndex,
  storyTotal,
  mode,
  providerDiagnostics,
  feedDiagnostics,
  interactionSummary,
  interactionWindow,
  eventDetail,
  eventDetailStatus,
  eventDetailMessage,
  eventActionStatus,
  eventActionMessage,
  saved,
  onModeChange,
  onInteractionWindowChange,
  onClose,
  onToggleSaved,
  onEventAction,
}: {
  story: StoryPackage;
  storyIndex: number;
  storyTotal: number;
  mode: DetailMode;
  providerDiagnostics: ProviderDiagnostics;
  feedDiagnostics: HeadlineFlowFeed["diagnostics"];
  interactionSummary: InteractionWindowedSummary | null;
  interactionWindow: InteractionSummaryWindow;
  eventDetail: HeadlineFlowEventRecord | null;
  eventDetailStatus: "idle" | "loading" | "error";
  eventDetailMessage: string;
  eventActionStatus: "idle" | "loading" | "error";
  eventActionMessage: string;
  saved: boolean;
  onModeChange: (mode: DetailMode) => void;
  onInteractionWindowChange: (window: InteractionSummaryWindow) => void;
  onClose: () => void;
  onToggleSaved: () => void;
  onEventAction: (action: "save" | "unsave" | "mute" | "unmute" | "resolve" | "restore") => void;
}) {
  const sourceTrail = storySourceTrail(story);
  const imageState = imageProvenanceLabel(story);
  const provider = providerDiagnostics.provider;
  const linkResolution = provider?.linkResolution;
  const imageExtraction = provider?.imageExtraction;
  const rawResponse = provider?.rawResponse;
  const topicCoverage = provider?.topicCoverage;
  const preference = story.userPreference ?? { saved: false, muted: false, resolved: false };
  const selectedInteractionSummary = interactionSummary?.windows[interactionWindow] ?? null;
  const activeTabId = `headline-flow-detail-tab-${mode}`;
  const activePanelId = `headline-flow-detail-panel-${mode}`;

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/55 p-2 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Story details"
      aria-describedby="headline-flow-detail-summary"
    >
      <section className="flex w-full max-w-[620px] flex-col overflow-hidden rounded-[22px] border border-white/10 bg-slate-950 shadow-[0_28px_90px_rgba(0,0,0,0.55)] sm:rounded-[28px]">
        <header className="border-b border-white/10 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={cn("text-xs font-bold uppercase tracking-[0.18em]", topicTone(story.topic))}>
                Story {storyIndex} of {storyTotal} · {topicLabel(story.topic)}
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-white sm:text-3xl">{story.headline}</h2>
              <p id="headline-flow-detail-summary" className="sr-only">{story.shortSummary}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
              aria-label="Close story details"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label="Story detail sections">
            {[
              { label: "Overview", value: "overview" as const },
              { label: "Timeline", value: "timeline" as const },
              { label: "Sources", value: "sources" as const },
              { label: "Why", value: "why" as const },
              { label: "Diagnostics", value: "diagnostics" as const },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onModeChange(item.value)}
                id={`headline-flow-detail-tab-${item.value}`}
                role="tab"
                aria-selected={mode === item.value}
                aria-controls={`headline-flow-detail-panel-${item.value}`}
                className={cn(
                  "rounded-2xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition",
                  mode === item.value ? "border-sky-300/30 bg-sky-300/15 text-sky-100" : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <div
          id={activePanelId}
          role="tabpanel"
          aria-labelledby={activeTabId}
          className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5"
        >
          {mode === "overview" ? (
            <div className="grid gap-4">
              <p className="text-base leading-7 text-slate-200">{story.shortSummary}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailMetric label="Status" value={story.status} />
                <DetailMetric label="Confidence" value={story.confidence === "multi_source" ? "Multi source" : "Single source"} />
                <DetailMetric label="Importance" value={story.importance} />
                <DetailMetric label="Freshness" value={freshnessLabel(story)} />
                <DetailMetric label="Priority score" value={`${story.displayMetadata.briefingScore}/100`} />
                <DetailMetric label="Visual" value={imageState} />
                <DetailMetric label="Article trail" value={`${sourceTrail.length} link${sourceTrail.length === 1 ? "" : "s"}`} />
                <DetailMetric label="Event" value={eventDetail ? `v${eventDetail.version} ${eventDetail.status}` : "Loading history"} />
                <DetailMetric label="Event ID" value={story.eventId} />
              </div>
              {story.displayMetadata.prioritySignals.length ? (
                <div className="rounded-3xl border border-sky-300/15 bg-sky-300/8 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Priority signals</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {story.displayMetadata.prioritySignals.map((signal) => (
                      <span key={signal} className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-semibold text-sky-100">
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ranking reason</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{story.displayMetadata.rankingReason}</p>
                {story.displayMetadata.personalizationReason ? (
                  <p className="mt-2 text-sm leading-6 text-sky-200">{story.displayMetadata.personalizationReason}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onToggleSaved}
                aria-pressed={saved}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                  saved ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10",
                )}
              >
                {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                {saved ? "Saved to briefing" : "Save to briefing"}
              </button>
              <div className="grid gap-2 rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Event controls</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => onEventAction(preference.saved ? "unsave" : "save")}
                    disabled={eventActionStatus === "loading"}
                    aria-pressed={preference.saved}
                    className={cn(
                      "rounded-2xl border px-3 py-2 text-sm font-semibold transition disabled:opacity-60",
                      preference.saved ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10",
                    )}
                  >
                    {preference.saved ? "Unsave event" : "Save event"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onEventAction(preference.muted ? "unmute" : "mute")}
                    disabled={eventActionStatus === "loading"}
                    aria-pressed={preference.muted}
                    className={cn(
                      "rounded-2xl border px-3 py-2 text-sm font-semibold transition disabled:opacity-60",
                      preference.muted ? "border-sky-300/30 bg-sky-300/15 text-sky-100" : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10",
                    )}
                  >
                    {preference.muted ? "Unmute" : "Mute"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onEventAction(preference.resolved ? "restore" : "resolve")}
                    disabled={eventActionStatus === "loading"}
                    aria-pressed={preference.resolved}
                    className={cn(
                      "rounded-2xl border px-3 py-2 text-sm font-semibold transition disabled:opacity-60",
                      preference.resolved ? "border-sky-300/30 bg-sky-300/15 text-sky-100" : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10",
                    )}
                  >
                    {preference.resolved ? "Restore" : "Resolve"}
                  </button>
                </div>
                {eventActionMessage ? (
                  <p className={cn("text-sm", eventActionStatus === "error" ? "text-rose-200" : "text-slate-400")} role="status" aria-live="polite">
                    {eventActionMessage}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {mode === "timeline" ? (
            <div className="grid gap-4">
              {eventDetailStatus === "loading" ? (
                <p className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-300">Loading event history...</p>
              ) : null}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <DetailMetric label="Event status" value={eventDetail?.status ?? story.status} />
                <DetailMetric label="Version" value={eventDetail ? `v${eventDetail.version}` : "Package"} />
                <DetailMetric
                  label="Evidence"
                  value={`${eventDetail?.articleCount ?? story.displayMetadata.articleCount} article${(eventDetail?.articleCount ?? story.displayMetadata.articleCount) === 1 ? "" : "s"}`}
                />
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Continuity</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {eventDetail
                    ? `First detected ${formatTimestamp(eventDetail.firstDetectedAt)}. Last meaningful update ${formatTimestamp(eventDetail.lastMeaningfulUpdateAt)}.`
                    : `Published ${formatTimestamp(story.publishedAt)}. Last package update ${formatTimestamp(story.updatedAt)}.`}
                </p>
              </div>
              {eventDetailStatus === "error" ? (
                <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">History unavailable</p>
                  <p className="mt-2 text-sm leading-6 text-amber-50">{eventDetailMessage}</p>
                </div>
              ) : null}
              {eventDetail ? (
                <>
                  <div className="grid gap-3">
                    {eventDetail.evidence.map((evidence, index) => (
                      <div key={evidence.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                        <div className="flex items-start gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-300/20 bg-sky-300/10 text-xs font-semibold text-sky-100">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              {evidence.sourceName} · {formatTimestamp(evidence.observedAt)}
                            </p>
                            <p className="mt-2 inline-flex rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-200">
                              {updateReasonLabel(evidence.updateReason)}
                            </p>
                            <p className="mt-1 text-sm font-semibold leading-5 text-white">{evidence.headline}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-400">{evidence.summary}</p>
                            <p className="mt-2 text-xs text-slate-500">
                              {evidence.providerId ? `${evidence.providerId} provider` : "Provider unavailable"}
                              {evidence.author ? ` · ${evidence.author}` : ""}
                              {evidence.retrievedAt ? ` · Retrieved ${formatTimestamp(evidence.retrievedAt)}` : ""}
                            </p>
                            {evidence.articleUrl ? (
                              <Link href={evidence.articleUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-sky-300">
                                Open evidence
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          {mode === "sources" ? (
            <div className="grid gap-3">
              <p className="text-sm leading-6 text-slate-400">
                {story.sourceSummary}. This package contains {story.displayMetadata.articleCount} article{story.displayMetadata.articleCount === 1 ? "" : "s"} from {story.sourceCount} source
                {story.sourceCount === 1 ? "" : "s"}.
              </p>
              {story.sources.map((source, index) => (
                <div key={source.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                  {(() => {
                    const trail = sourceTrail[index] ?? sourceTrail.find((item) => item.sourceName === source.name);
                    const articleHost = hostname(trail?.articleUrl ?? source.url);
                    const feedHost = hostname(trail?.feedUrl);
                    return (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Source {index + 1}</p>
                      <p className="mt-1 truncate text-base font-semibold text-white">{source.name}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{trail?.articleUrl ?? source.url ?? "No canonical URL available"}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                          {trail?.discoveryProvider === "publisher_rss" ? "Publisher RSS" : "RSS search"}
                        </span>
                        {articleHost ? (
                          <span className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                            {articleHost}
                          </span>
                        ) : null}
                        {feedHost ? (
                          <span className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                            Feed {feedHost}
                          </span>
                        ) : null}
                        {trail?.imageUrl ? (
                          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-200">
                            Image
                          </span>
                        ) : null}
                        {trail?.linkResolutionStatus ? (
                          <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-sky-200">
                            {trail.linkResolutionStatus}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {source.url ? (
                      <Link
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                        aria-label={`Open ${source.name}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    ) : null}
                  </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          ) : null}

          {mode === "why" ? (
            <div className="grid gap-4">
              <div className="rounded-3xl border border-sky-300/15 bg-sky-300/8 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Why it matters</p>
                <p className="mt-3 text-base leading-7 text-slate-200">{whyItMatters(story)}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Narration</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{story.narration}</p>
              </div>
            </div>
          ) : null}

          {mode === "diagnostics" ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailMetric label="Provider" value={providerLabel(providerDiagnostics.selectedProvider)} />
                <DetailMetric label="Cache" value={cacheLabel(providerDiagnostics.cache)} />
                <DetailMetric label="Stories" value={String(feedDiagnostics.storyCount)} />
                <DetailMetric label="Rejected" value={String(feedDiagnostics.rejectedArticles + (provider?.rejectedArticleUrls?.length ?? 0))} />
                <DetailMetric label="Registry" value={feedDiagnostics.eventRegistry?.status ?? "disabled"} />
                <DetailMetric label="Events" value={`${feedDiagnostics.eventRegistry?.createdEvents ?? 0} new, ${feedDiagnostics.eventRegistry?.updatedEvents ?? 0} updated`} />
                <DetailMetric label="Resolved" value={String(feedDiagnostics.eventRegistry?.resolvedEvents ?? 0)} />
                <DetailMetric label="Personalization" value={feedDiagnostics.personalization?.status ?? "skipped"} />
                <DetailMetric label="Boosted" value={`${feedDiagnostics.personalization?.boostedStories ?? 0} stories`} />
              </div>
              <div className="grid gap-3 rounded-3xl border border-sky-300/15 bg-sky-300/8 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Ranking audit</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <DiagnosticLine icon={Sparkles} label="Story score" value={`${story.displayMetadata.rankingAudit.baseScore} base + ${story.displayMetadata.rankingAudit.personalizationBoost} boost = ${story.displayMetadata.rankingAudit.finalScore}`} />
                  <DiagnosticLine icon={List} label="Rank movement" value={`#${story.displayMetadata.rankingAudit.originalRank} to #${story.displayMetadata.rankingAudit.personalizedRank}`} />
                  <DiagnosticLine icon={Bookmark} label="Saved events" value={String(feedDiagnostics.personalization?.savedEventCount ?? 0)} />
                  <DiagnosticLine icon={Activity} label="Reordered" value={`${feedDiagnostics.personalization?.reorderedStories ?? 0} stories`} />
                </div>
                {Object.keys(feedDiagnostics.personalization?.topicWeights ?? {}).length ? (
                  <p className="text-sm leading-6 text-slate-300">
                    Topic weights: {Object.entries(feedDiagnostics.personalization?.topicWeights ?? {}).map(([name, value]) => `${topicLabel(name)} +${value}`).join(", ")}
                  </p>
                ) : (
                  <p className="text-sm leading-6 text-slate-400">No saved-topic weights are active for this feed.</p>
                )}
                {Object.keys(feedDiagnostics.personalization?.interactionTopicWeights ?? {}).length ? (
                  <p className="text-sm leading-6 text-slate-300">
                    Interaction weights: {Object.entries(feedDiagnostics.personalization?.interactionTopicWeights ?? {}).map(([name, value]) => `${topicLabel(name)} +${value}`).join(", ")}
                  </p>
                ) : null}
                {Object.keys(feedDiagnostics.personalization?.mutedTopicWeights ?? {}).length ? (
                  <p className="text-sm leading-6 text-amber-100">
                    Muted-topic penalties: {Object.entries(feedDiagnostics.personalization?.mutedTopicWeights ?? {}).map(([name, value]) => `${topicLabel(name)} -${value}`).join(", ")}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Interaction analytics</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["24h", "7d", "all"] as const).map((window) => (
                      <button
                        key={window}
                        type="button"
                        onClick={() => onInteractionWindowChange(window)}
                        aria-pressed={interactionWindow === window}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                          interactionWindow === window ? "border-sky-300/30 bg-sky-300/15 text-sky-100" : "border-white/10 bg-white/5 text-slate-400",
                        )}
                      >
                        {window}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <DiagnosticLine icon={Activity} label="Tracked actions" value={String(selectedInteractionSummary?.totalEvents ?? 0)} />
                  <DiagnosticLine icon={ExternalLink} label="Source open rate" value={`${Math.round((selectedInteractionSummary?.sourceOpenRate ?? 0) * 100)}%`} />
                  <DiagnosticLine icon={Bookmark} label="Saved topics" value={formatCounts(selectedInteractionSummary?.savedTopicCounts)} />
                  <DiagnosticLine icon={X} label="Muted topics" value={formatCounts(selectedInteractionSummary?.mutedTopicCounts)} />
                </div>
                <p className="text-sm leading-6 text-slate-500">
                  Retention: {interactionSummary?.retentionDays ?? 90} days
                  {interactionSummary?.prunedEvents ? ` · ${interactionSummary.prunedEvents} old event${interactionSummary.prunedEvents === 1 ? "" : "s"} pruned` : ""}
                </p>
              </div>
              <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                <DiagnosticLine icon={Activity} label="Topic coverage" value={`${topicCoverage?.fulfilledTopics.length ?? 0}/${topicCoverage?.attemptedTopics.length ?? 0} topics`} />
                <DiagnosticLine icon={Clock} label="Freshness" value={`${freshnessLabel(story)} · ${provider?.freshnessWindowHours ?? 48}h window`} />
                <DiagnosticLine icon={FileText} label="Article trail" value={`${sourceTrail.length} article link${sourceTrail.length === 1 ? "" : "s"}`} />
                <DiagnosticLine icon={Images} label="Hero visual" value={imageState} />
                <DiagnosticLine icon={Images} label="Images" value={`${imageExtraction?.found ?? 0} found, ${imageExtraction?.fallback ?? 0} fallback, ${imageExtraction?.rejected ?? 0} rejected`} />
                <DiagnosticLine icon={ExternalLink} label="Links" value={`${linkResolution?.direct ?? 0} direct, ${linkResolution?.resolved ?? 0} resolved, ${linkResolution?.rejected ?? 0} rejected`} />
                <DiagnosticLine icon={FileText} label="Parsed" value={`${rawResponse?.parsedArticleCount ?? 0} RSS items across ${rawResponse?.responseCount ?? 0} responses`} />
              </div>
              {topicCoverage?.lowYieldTopics?.length ? (
                <p className="text-sm leading-6 text-amber-100">
                  Thin subjects: {topicCoverage.lowYieldTopics.map(topicLabel).join(", ")}
                </p>
              ) : null}
              {providerDiagnostics.fallbackReason || providerDiagnostics.providerError || provider?.error ? (
                <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4">
                  <div className="flex items-center gap-2 text-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">Provider notice</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-amber-50">
                    {providerDiagnostics.providerError || provider?.error || providerDiagnostics.fallbackReason}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold capitalize text-slate-100">{value}</p>
    </div>
  );
}

function WhatChangedStrip({ story }: { story?: StoryPackage }) {
  const reasons = storyUpdateReasons(story);
  const status = story?.eventMetadata?.status ?? story?.status ?? "developing";
  return (
    <div className={cn("mt-5 rounded-3xl border px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]", storyEvolutionTone(story))}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-75">What changed</p>
          <p className="mt-1 text-sm font-semibold leading-6">{storyUpdateSummary(story)}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <span className="rounded-full border border-current/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
            {status}
          </span>
          {story?.eventMetadata ? (
            <span className="rounded-full border border-current/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
              v{story.eventMetadata.version}
            </span>
          ) : null}
          {reasons.slice(0, 2).map((reason) => (
            <span key={reason} className="rounded-full border border-current/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
              {updateReasonLabel(reason)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function DiagnosticLine({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-sky-300" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <p className="mt-1 text-sm text-slate-200">{value}</p>
      </div>
    </div>
  );
}

function StoryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold capitalize text-slate-100">{value}</p>
    </div>
  );
}

function SourceLinks({ story, onSourceOpen }: { story: StoryPackage; onSourceOpen: (sourceName: string) => void }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {story.sources.map((source) =>
        source.url ? (
          <Link
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            onClick={() => onSourceOpen(source.name)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            {source.name}
          </Link>
        ) : (
          <span key={source.id} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            {source.name}
          </span>
        ),
      )}
    </div>
  );
}

function StatusItem({ icon: Icon, text, tone }: { icon: LucideIcon; text: string; tone: string }) {
  return (
    <div className="flex items-center justify-center gap-2 md:justify-start">
      <Icon className={cn("h-4 w-4", tone)} />
      <span>{text}</span>
    </div>
  );
}
