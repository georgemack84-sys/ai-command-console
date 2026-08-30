import {
  getHeadlineFlowFeedCacheTtlMs,
  getHeadlineFlowMinReadyStories,
  getHeadlineFlowMinReadyTopics,
  getHeadlineFlowStaleCacheMaxAgeMs,
  isProduction,
} from "@/src/config/env";
import type { HeadlineFlowFeed, HeadlineFlowTopic } from "@/src/server/headline-flow/domain/types";

export type HeadlineFlowFeedHealthStatus = "healthy" | "degraded" | "not_started";

export type HeadlineFlowFeedHealthSnapshot = {
  status: HeadlineFlowFeedHealthStatus;
  checkedAt: string;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastFailureMessage: string | null;
  ageMs: number | null;
  providerId: string | null;
  storyCount: number;
  topicCount: number;
  cacheTtlMs: number;
  staleCacheMaxAgeMs: number;
  minReadyStories: number;
  minReadyTopics: number;
  stale: boolean;
  fixtureBacked: boolean;
  productionReady: boolean;
};

type FeedHealthState = {
  lastSuccessAt: number | null;
  lastFailureAt: number | null;
  lastFailureMessage: string | null;
  providerId: string | null;
  storyCount: number;
  topicCount: number;
  fixtureBacked: boolean;
};

const state: FeedHealthState = {
  lastSuccessAt: null,
  lastFailureAt: null,
  lastFailureMessage: null,
  providerId: null,
  storyCount: 0,
  topicCount: 0,
  fixtureBacked: false,
};

function topicCount(feed: HeadlineFlowFeed) {
  return new Set(feed.stories.map((story) => story.topic).filter(Boolean) as HeadlineFlowTopic[]).size;
}

export function recordHeadlineFlowFeedSuccess(feed: HeadlineFlowFeed, options?: { fixtureBacked?: boolean }) {
  state.lastSuccessAt = Date.now();
  state.providerId = feed.providerId;
  state.storyCount = feed.diagnostics.storyCount;
  state.topicCount = topicCount(feed);
  state.fixtureBacked = Boolean(options?.fixtureBacked || feed.providerId === "fixture");
}

export function recordHeadlineFlowFeedFailure(error: unknown) {
  state.lastFailureAt = Date.now();
  state.lastFailureMessage = error instanceof Error ? error.message : String(error);
}

export function resetHeadlineFlowFeedHealthForTests() {
  state.lastSuccessAt = null;
  state.lastFailureAt = null;
  state.lastFailureMessage = null;
  state.providerId = null;
  state.storyCount = 0;
  state.topicCount = 0;
  state.fixtureBacked = false;
}

export function getHeadlineFlowFeedHealth(nowMs = Date.now()): HeadlineFlowFeedHealthSnapshot {
  const cacheTtlMs = getHeadlineFlowFeedCacheTtlMs();
  const staleCacheMaxAgeMs = getHeadlineFlowStaleCacheMaxAgeMs();
  const minReadyStories = getHeadlineFlowMinReadyStories();
  const minReadyTopics = getHeadlineFlowMinReadyTopics();
  const ageMs = state.lastSuccessAt ? Math.max(0, nowMs - state.lastSuccessAt) : null;
  const stale = ageMs === null || ageMs > Math.max(cacheTtlMs, staleCacheMaxAgeMs);
  const hasEnoughStories = state.storyCount >= minReadyStories;
  const hasEnoughTopics = state.topicCount >= minReadyTopics;
  const fixtureBlocked = isProduction() && state.fixtureBacked;
  const productionReady = Boolean(state.lastSuccessAt && !stale && hasEnoughStories && hasEnoughTopics && !fixtureBlocked);
  const status: HeadlineFlowFeedHealthStatus = state.lastSuccessAt
    ? productionReady
      ? "healthy"
      : "degraded"
    : "not_started";

  return {
    status,
    checkedAt: new Date(nowMs).toISOString(),
    lastSuccessAt: state.lastSuccessAt ? new Date(state.lastSuccessAt).toISOString() : null,
    lastFailureAt: state.lastFailureAt ? new Date(state.lastFailureAt).toISOString() : null,
    lastFailureMessage: state.lastFailureMessage,
    ageMs,
    providerId: state.providerId,
    storyCount: state.storyCount,
    topicCount: state.topicCount,
    cacheTtlMs,
    staleCacheMaxAgeMs,
    minReadyStories,
    minReadyTopics,
    stale,
    fixtureBacked: state.fixtureBacked,
    productionReady,
  };
}
