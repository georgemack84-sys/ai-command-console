import { env, getHeadlineFlowAutoFallbackTimeoutMs, getHeadlineFlowWebSearchTimeoutMs, headlineFlowFixtureProviderEnabled, isProduction } from "@/src/config/env";
import { getHeadlineFlowFeedHealth, type HeadlineFlowFeedHealthSnapshot } from "@/src/server/headline-flow/application/feed-health";
import { isOpenAIWebSearchConfigured } from "@/src/server/headline-flow/providers/openai-web-search-news-provider";

export type HeadlineFlowReadinessStatus = "ready" | "degraded" | "not_ready";

export type HeadlineFlowReadinessSnapshot = {
  status: HeadlineFlowReadinessStatus;
  checkedAt: string;
  production: boolean;
  summary: string;
  checks: {
    rss: {
      ok: boolean;
      status: "available";
    };
    webSearch: {
      ok: boolean;
      status: "configured" | "missing_configuration";
      timeoutMs: number;
    };
    timeoutPolicy: {
      ok: boolean;
      webSearchTimeoutMs: number;
      autoFallbackTimeoutMs: number;
      status: "aligned" | "auto_fallback_too_short";
    };
    fixtureFallback: {
      ok: boolean;
      status: "enabled" | "disabled";
    };
    feed: HeadlineFlowFeedHealthSnapshot;
  };
  warnings: Array<{ code: string; message: string }>;
  blockers: Array<{ code: string; message: string }>;
};

export function getHeadlineFlowReadiness(nowMs = Date.now()): HeadlineFlowReadinessSnapshot {
  const production = isProduction();
  const feed = getHeadlineFlowFeedHealth(nowMs);
  const webSearchConfigured = isOpenAIWebSearchConfigured();
  const fixtureFallbackEnabled = headlineFlowFixtureProviderEnabled();
  const webSearchTimeoutMs = getHeadlineFlowWebSearchTimeoutMs();
  const autoFallbackTimeoutMs = getHeadlineFlowAutoFallbackTimeoutMs();
  const timeoutPolicyOk = autoFallbackTimeoutMs >= webSearchTimeoutMs;
  const configuredProvider = env.HEADLINE_FLOW_PROVIDER;
  const webSearchExpected = configuredProvider === "auto" || configuredProvider === "web_search";
  const warnings: HeadlineFlowReadinessSnapshot["warnings"] = [];
  const blockers: HeadlineFlowReadinessSnapshot["blockers"] = [];
  const feedThin = feed.status !== "healthy";

  if (!webSearchConfigured && webSearchExpected) {
    const issue = {
      code: "web_search_missing",
      message: "OPENAI_API_KEY is missing, so OpenAI web search is unavailable. RSS remains the keyless live provider.",
    };
    if (production && feedThin) {
      blockers.push(issue);
    } else {
      warnings.push(issue);
    }
  }

  if (webSearchExpected && !timeoutPolicyOk) {
    blockers.push({
      code: "web_search_timeout_policy",
      message: "Auto fallback timeout is shorter than the live web-search timeout.",
    });
  }

  if (feedThin) {
    warnings.push({
      code: `feed_${feed.status}`,
      message: feed.status === "not_started"
        ? "No successful Headline Flow feed build has completed yet."
        : "The last Headline Flow feed is below the configured story or topic threshold.",
    });
  }

  if (production && feed.fixtureBacked) {
    blockers.push({
      code: "fixture_backed_production",
      message: "Production readiness cannot depend on fixture-backed Headline Flow content.",
    });
  }

  const status: HeadlineFlowReadinessStatus = blockers.length
    ? production
      ? "not_ready"
      : "degraded"
    : warnings.length
      ? "degraded"
      : "ready";

  return {
    status,
    checkedAt: new Date(nowMs).toISOString(),
    production,
    summary: status === "ready"
      ? "Live Headline Flow providers are ready."
      : blockers.length
        ? blockers[0].message
        : warnings[0]?.message ?? "Headline Flow readiness has warnings.",
    checks: {
      rss: {
        ok: true,
        status: "available",
      },
      webSearch: {
        ok: webSearchConfigured,
        status: webSearchConfigured ? "configured" : "missing_configuration",
        timeoutMs: webSearchTimeoutMs,
      },
      timeoutPolicy: {
        ok: timeoutPolicyOk,
        webSearchTimeoutMs,
        autoFallbackTimeoutMs,
        status: timeoutPolicyOk ? "aligned" : "auto_fallback_too_short",
      },
      fixtureFallback: {
        ok: fixtureFallbackEnabled,
        status: fixtureFallbackEnabled ? "enabled" : "disabled",
      },
      feed,
    },
    warnings,
    blockers,
  };
}
