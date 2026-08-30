import { env } from "@/src/config/env";
import { FixtureNewsProvider } from "@/src/server/headline-flow/providers/fixture-news-provider";
import { GoogleNewsRssProvider } from "@/src/server/headline-flow/providers/google-news-rss-provider";
import { isOpenAIWebSearchConfigured, OpenAIWebSearchNewsProvider } from "@/src/server/headline-flow/providers/openai-web-search-news-provider";
import type { NewsProvider } from "@/src/server/headline-flow/providers/types";

export type HeadlineFlowProviderMode = "auto" | "fixture" | "rss" | "web_search";

export type HeadlineFlowProviderSelection = {
  provider: NewsProvider;
  requestedProvider: HeadlineFlowProviderMode;
  configuredProvider: HeadlineFlowProviderMode;
  selectedProvider: "fixture" | "rss" | "web_search";
  fallbackReason: string | null;
  webSearchConfigured: boolean;
};

export function resolveHeadlineFlowProviderMode(value?: string | null): HeadlineFlowProviderMode {
  if (value === "fixture" || value === "rss" || value === "web_search" || value === "auto") {
    return value;
  }
  if (
    env.HEADLINE_FLOW_PROVIDER === "fixture" ||
    env.HEADLINE_FLOW_PROVIDER === "rss" ||
    env.HEADLINE_FLOW_PROVIDER === "web_search" ||
    env.HEADLINE_FLOW_PROVIDER === "auto"
  ) {
    return env.HEADLINE_FLOW_PROVIDER;
  }
  return "auto";
}

export function createHeadlineFlowProvider(mode: HeadlineFlowProviderMode = resolveHeadlineFlowProviderMode()): NewsProvider {
  if (mode === "fixture") {
    return new FixtureNewsProvider();
  }

  if (mode === "rss") {
    return new GoogleNewsRssProvider();
  }

  if (mode === "web_search") {
    return new OpenAIWebSearchNewsProvider();
  }

  return new GoogleNewsRssProvider();
}

export function selectHeadlineFlowProvider(mode: HeadlineFlowProviderMode = resolveHeadlineFlowProviderMode()): HeadlineFlowProviderSelection {
  const webSearchConfigured = isOpenAIWebSearchConfigured();
  const configuredProvider = resolveHeadlineFlowProviderMode();

  if (mode === "fixture") {
    return {
      provider: new FixtureNewsProvider(),
      requestedProvider: mode,
      configuredProvider,
      selectedProvider: "fixture",
      fallbackReason: null,
      webSearchConfigured,
    };
  }

  if (mode === "rss") {
    return {
      provider: new GoogleNewsRssProvider(),
      requestedProvider: mode,
      configuredProvider,
      selectedProvider: "rss",
      fallbackReason: null,
      webSearchConfigured,
    };
  }

  if (mode === "web_search") {
    return {
      provider: new OpenAIWebSearchNewsProvider(),
      requestedProvider: mode,
      configuredProvider,
      selectedProvider: "web_search",
      fallbackReason: webSearchConfigured ? null : "missing_openai_api_key",
      webSearchConfigured,
    };
  }

  return {
    provider: new GoogleNewsRssProvider(),
    requestedProvider: mode,
    configuredProvider,
    selectedProvider: "rss",
    fallbackReason: null,
    webSearchConfigured,
  };
}
