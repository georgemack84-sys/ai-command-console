import OpenAI from "openai";
import { createRequire } from "node:module";
import {
  aiSummaryAllowsMockFallback,
  aiSummaryEvaluationsEnabled,
  env,
  getAiSummaryDailyBudgetUsd,
  getAiSummaryEstimatedCostPerRunUsd,
  getAiSummaryMaxAttempts,
  getAiSummaryTimeoutMs,
} from "@/src/config/env";
import { logger } from "@/src/server/observability/logger";
import { createTraceId } from "@/src/server/observability/trace-id";
import { listRuntimeDiagnostics, recordRuntimeDiagnostic } from "@/src/server/observability/runtime-diagnostics";

const require = createRequire(import.meta.url);
const { getAiSummaryBudgetSnapshot, recordAiSummarySpend, clearAiSummaryBudgetForTests } = require("../../../services/aiSummaryBudget");

type SummaryInput = {
  workspaceName: string;
  summaryType: "workspace-insight" | "triage-brief";
  focus: string;
  bulletPoints: string[];
  traceId?: string;
};
type SummaryGenerationOptions = {
  forceFallbackReason?: string | null;
  maxAttemptsOverride?: number;
};

export type GeneratedSummary = {
  title: string;
  summary: string;
  bullets: string[];
  provider: "openai" | "mock";
  model: string;
  promptVersion: string;
  attempts: number;
  latencyMs: number;
  fallbackReason: string | null;
  traceId: string;
};

export type AiSummaryDiagnostic = ReturnType<typeof listRuntimeDiagnostics>[number];
type AiSummaryProviderMode = "auto" | "openai" | "mock";
type AiSummaryRuntimeConfig = {
  providerMode: AiSummaryProviderMode;
  timeoutMs: number;
  maxAttempts: number;
  allowMockFallback: boolean;
  dailyBudgetUsd: number;
  estimatedCostPerRunUsd: number;
  evaluationsEnabled: boolean;
};

let cachedClient: OpenAI | null = null;
let testClient: Pick<OpenAI, "responses"> | null = null;
let testConfig: AiSummaryRuntimeConfig | null = null;
const SUMMARY_PROMPT_VERSION = "2026-04-06.v1";

function getRuntimeConfig(): AiSummaryRuntimeConfig {
  if (testConfig) {
    return testConfig;
  }

  return {
    providerMode: env.AI_SUMMARY_PROVIDER_MODE,
    timeoutMs: getAiSummaryTimeoutMs(),
    maxAttempts: getAiSummaryMaxAttempts(),
    allowMockFallback: aiSummaryAllowsMockFallback(),
    dailyBudgetUsd: getAiSummaryDailyBudgetUsd(),
    estimatedCostPerRunUsd: getAiSummaryEstimatedCostPerRunUsd(),
    evaluationsEnabled: aiSummaryEvaluationsEnabled(),
  };
}

function getClient() {
  if (testClient) {
    return testClient;
  }
  if (!env.OPENAI_API_KEY || typeof window !== "undefined") {
    return null;
  }
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return cachedClient;
}

function buildTitle(input: SummaryInput) {
  return `${input.workspaceName} ${input.summaryType === "triage-brief" ? "briefing" : "insight"} summary`;
}

function buildMockSummary(
  input: SummaryInput,
  options?: { attempts?: number; latencyMs?: number; reason?: string | null; traceId?: string },
): GeneratedSummary {
  const topBullets = input.bulletPoints.slice(0, 3);
  return {
    title: buildTitle(input),
    summary: `${input.focus} is the main operator focus right now. ${topBullets[0] || "Recent signals are stable enough to review."}`,
    bullets: topBullets.length ? topBullets : ["No major signals were available, so the summary remained concise."],
    provider: "mock",
    model: "rule-based-fallback",
    promptVersion: SUMMARY_PROMPT_VERSION,
    attempts: options?.attempts ?? 0,
    latencyMs: options?.latencyMs ?? 0,
    fallbackReason: options?.reason ?? null,
    traceId: options?.traceId ?? input.traceId ?? createTraceId("ai"),
  };
}

function parseAiText(
  text: string,
  input: SummaryInput,
  options?: { attempts?: number; latencyMs?: number; traceId?: string },
): GeneratedSummary {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const bullets = lines.filter((line) => line.startsWith("-")).map((line) => line.replace(/^-+\s*/, ""));
  const summaryLine = lines.find((line) => !line.startsWith("-")) || input.focus;

  return {
    title: buildTitle(input),
    summary: summaryLine,
    bullets: bullets.length ? bullets.slice(0, 5) : input.bulletPoints.slice(0, 5),
    provider: "openai",
    model: env.AI_SUMMARY_MODEL,
    promptVersion: SUMMARY_PROMPT_VERSION,
    attempts: options?.attempts ?? 1,
    latencyMs: options?.latencyMs ?? 0,
    fallbackReason: null,
    traceId: options?.traceId ?? input.traceId ?? createTraceId("ai"),
  };
}

function buildPrompt(input: SummaryInput) {
  return [
    `You are generating an internal ${input.summaryType} for ${input.workspaceName}.`,
    `Prompt version: ${SUMMARY_PROMPT_VERSION}`,
    `Focus area: ${input.focus}`,
    "Use a concise operator tone.",
    "Return one short paragraph followed by 3-5 bullet points.",
    "Do not use markdown headings.",
    "Signals:",
    ...input.bulletPoints.map((item) => `- ${item}`),
  ].join("\n");
}

async function createSummaryResponse(
  client: Pick<OpenAI, "responses">,
  prompt: string,
  attempt: number,
  timeoutMs: number,
): Promise<string | null> {
  const timeoutError = new Error(`AI summary request timed out after ${timeoutMs}ms on attempt ${attempt}.`);
  let timeoutId: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(timeoutError), timeoutMs);
  });

  const responsePromise = client.responses.create({
    model: env.AI_SUMMARY_MODEL,
    input: prompt,
  });

  try {
    const response = (await Promise.race([responsePromise, timeoutPromise])) as Awaited<typeof responsePromise>;
    return response.output_text?.trim() || null;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function shouldRetry(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes("timed out") || message.includes("rate limit") || message.includes("temporar") || message.includes("overloaded");
}

function evaluateGeneratedSummary(summary: GeneratedSummary) {
  const checks = {
    hasSummary: summary.summary.trim().length >= 24,
    bulletCountHealthy: summary.bullets.length >= 3,
    usesFallback: summary.provider === "mock",
    conciseBullets: summary.bullets.every((bullet) => bullet.length <= 180),
  };
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedChecks / Object.keys(checks).length) * 100);
  return {
    score,
    status: score >= 75 ? "healthy" : score >= 50 ? "warning" : "critical",
    checks,
  };
}

function recordSummaryEvaluation(summary: GeneratedSummary, input: SummaryInput, config: AiSummaryRuntimeConfig) {
  if (!config.evaluationsEnabled) {
    return;
  }

  const evaluation = evaluateGeneratedSummary(summary);
  recordRuntimeDiagnostic({
    scope: "ai.summary.eval",
    level: evaluation.status === "critical" ? "error" : evaluation.status === "warning" ? "warn" : "info",
    message: `AI summary evaluation ${evaluation.status}.`,
    traceId: summary.traceId,
    context: {
      traceId: summary.traceId,
      workspaceName: input.workspaceName,
      summaryType: input.summaryType,
      provider: summary.provider,
      promptVersion: summary.promptVersion,
      score: evaluation.score,
      checks: evaluation.checks,
    },
  });
}

export async function generateStructuredSummary(input: SummaryInput, options?: SummaryGenerationOptions): Promise<GeneratedSummary> {
  const traceId = input.traceId ?? createTraceId("ai");
  const config = getRuntimeConfig();
  const maxAttempts = Number.isFinite(options?.maxAttemptsOverride)
    ? Math.max(1, Math.floor(options?.maxAttemptsOverride ?? config.maxAttempts))
    : config.maxAttempts;
  if (options?.forceFallbackReason) {
    logger.warn("AI summary fallback drill forced mock output.", {
      traceId,
      providerMode: config.providerMode,
      promptVersion: SUMMARY_PROMPT_VERSION,
      workspaceName: input.workspaceName,
      summaryType: input.summaryType,
      fallbackReason: options.forceFallbackReason,
    });
    recordRuntimeDiagnostic({
      scope: "ai.summary",
      level: "warn",
      message: "AI summary fallback drill forced mock output.",
      traceId,
      context: {
        traceId,
        providerMode: config.providerMode,
        promptVersion: SUMMARY_PROMPT_VERSION,
        workspaceName: input.workspaceName,
        summaryType: input.summaryType,
        fallbackReason: options.forceFallbackReason,
        forced: true,
      },
    });
    const summary = buildMockSummary(input, {
      reason: options.forceFallbackReason,
      traceId,
    });
    recordSummaryEvaluation(summary, input, config);
    return summary;
  }
  const shouldUseMockOnly = config.providerMode === "mock";
  const client = getClient();
  if (shouldUseMockOnly) {
    logger.info("AI summary provider mode forced mock output.", {
      traceId,
      providerMode: config.providerMode,
      promptVersion: SUMMARY_PROMPT_VERSION,
      workspaceName: input.workspaceName,
      summaryType: input.summaryType,
    });
    recordRuntimeDiagnostic({
      scope: "ai.summary",
      level: "info",
      message: "AI summary provider mode forced mock output.",
      traceId,
      context: {
        traceId,
        providerMode: config.providerMode,
        promptVersion: SUMMARY_PROMPT_VERSION,
        workspaceName: input.workspaceName,
        summaryType: input.summaryType,
      },
    });
    const summary = buildMockSummary(input, { reason: "provider_mode_mock", traceId });
    recordSummaryEvaluation(summary, input, config);
    return summary;
  }

  if (!client) {
    const fallbackReason = config.providerMode === "openai" ? "provider_required_unavailable" : "provider_unavailable";
    const level = config.providerMode === "openai" ? "error" : "warn";
    logger.warn("AI summary provider unavailable; using fallback summary.", {
      traceId,
      providerMode: config.providerMode,
      allowMockFallback: config.allowMockFallback,
      model: env.AI_SUMMARY_MODEL,
      promptVersion: SUMMARY_PROMPT_VERSION,
      workspaceName: input.workspaceName,
      summaryType: input.summaryType,
    });
    recordRuntimeDiagnostic({
      scope: "ai.summary",
      level,
      message: config.providerMode === "openai"
        ? "OpenAI summary provider was required but unavailable; fallback summary used."
        : "AI summary provider unavailable; fallback summary used.",
      traceId,
      context: {
        traceId,
        providerMode: config.providerMode,
        allowMockFallback: config.allowMockFallback,
        model: env.AI_SUMMARY_MODEL,
        promptVersion: SUMMARY_PROMPT_VERSION,
        workspaceName: input.workspaceName,
        summaryType: input.summaryType,
      },
    });
    const summary = buildMockSummary(input, { reason: fallbackReason, traceId });
    recordSummaryEvaluation(summary, input, config);
    return summary;
  }

  const budgetSnapshot = getAiSummaryBudgetSnapshot({
    dailyBudgetUsd: config.dailyBudgetUsd,
    estimatedCostPerRunUsd: config.estimatedCostPerRunUsd,
  });
  if (budgetSnapshot.budgetExceeded) {
    logger.warn("AI summary budget threshold reached; using fallback summary.", {
      traceId,
      dailyBudgetUsd: config.dailyBudgetUsd,
      usageUsd: budgetSnapshot.usageUsd,
      projectedUsageUsd: budgetSnapshot.projectedUsageUsd,
    });
    recordRuntimeDiagnostic({
      scope: "ai.summary",
      level: "warn",
      message: "AI summary budget threshold reached; fallback summary used.",
      traceId,
      context: {
        traceId,
        dailyBudgetUsd: config.dailyBudgetUsd,
        usageUsd: budgetSnapshot.usageUsd,
        projectedUsageUsd: budgetSnapshot.projectedUsageUsd,
        estimatedCostPerRunUsd: config.estimatedCostPerRunUsd,
        workspaceName: input.workspaceName,
        summaryType: input.summaryType,
      },
    });
    const summary = buildMockSummary(input, { reason: "budget_guard", traceId });
    recordSummaryEvaluation(summary, input, config);
    return summary;
  }

  const prompt = buildPrompt(input);
  const startedAt = Date.now();
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const text = await createSummaryResponse(client, prompt, attempt, config.timeoutMs);
      const latencyMs = Date.now() - startedAt;
      if (!text) {
        logger.warn("AI summary response was empty; using fallback summary.", {
          traceId,
          providerMode: config.providerMode,
          model: env.AI_SUMMARY_MODEL,
          promptVersion: SUMMARY_PROMPT_VERSION,
          attempt,
        });
        recordRuntimeDiagnostic({
          scope: "ai.summary",
          level: "warn",
          message: "AI summary response was empty; fallback summary used.",
          traceId,
          context: {
            traceId,
            providerMode: config.providerMode,
            model: env.AI_SUMMARY_MODEL,
            promptVersion: SUMMARY_PROMPT_VERSION,
            attempt,
            workspaceName: input.workspaceName,
            summaryType: input.summaryType,
          },
        });
        recordAiSummarySpend({
          traceId,
          provider: env.AI_SUMMARY_MODEL,
          attempts: attempt,
          costUsd: config.estimatedCostPerRunUsd * attempt,
          dailyBudgetUsd: config.dailyBudgetUsd,
          estimatedCostPerRunUsd: config.estimatedCostPerRunUsd,
        });
        const summary = buildMockSummary(input, {
          attempts: attempt,
          latencyMs,
          reason: "empty_response",
          traceId,
        });
        recordSummaryEvaluation(summary, input, config);
        return summary;
      }

      logger.info("AI summary generated successfully.", {
        traceId,
        providerMode: config.providerMode,
        model: env.AI_SUMMARY_MODEL,
        promptVersion: SUMMARY_PROMPT_VERSION,
        attempt,
        latencyMs,
      });
      recordRuntimeDiagnostic({
        scope: "ai.summary",
        level: "info",
        message: "AI summary generated successfully.",
        traceId,
        context: {
          traceId,
          providerMode: config.providerMode,
          model: env.AI_SUMMARY_MODEL,
          promptVersion: SUMMARY_PROMPT_VERSION,
          attempt,
          latencyMs,
          workspaceName: input.workspaceName,
          summaryType: input.summaryType,
        },
      });
      recordAiSummarySpend({
        traceId,
        provider: env.AI_SUMMARY_MODEL,
        attempts: attempt,
        costUsd: config.estimatedCostPerRunUsd * attempt,
        dailyBudgetUsd: config.dailyBudgetUsd,
        estimatedCostPerRunUsd: config.estimatedCostPerRunUsd,
      });
      const summary = parseAiText(text, input, { attempts: attempt, latencyMs, traceId });
      recordSummaryEvaluation(summary, input, config);
      return summary;
    } catch (error) {
      lastError = error;
      const retryable = attempt < maxAttempts && shouldRetry(error);
      logger.warn("AI summary generation attempt failed.", {
        traceId,
        providerMode: config.providerMode,
        message: error instanceof Error ? error.message : String(error),
        model: env.AI_SUMMARY_MODEL,
        promptVersion: SUMMARY_PROMPT_VERSION,
        attempt,
        retryable,
      });
      recordRuntimeDiagnostic({
        scope: "ai.summary",
        level: retryable ? "warn" : "error",
        message: retryable ? "AI summary generation attempt failed; retrying." : "AI summary generation failed; using fallback summary.",
        traceId,
        context: {
          traceId,
          providerMode: config.providerMode,
          model: env.AI_SUMMARY_MODEL,
          promptVersion: SUMMARY_PROMPT_VERSION,
          attempt,
          retryable,
          workspaceName: input.workspaceName,
          summaryType: input.summaryType,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      if (!retryable) {
        break;
      }
    }
  }

  recordAiSummarySpend({
    traceId,
    provider: env.AI_SUMMARY_MODEL,
    attempts: maxAttempts,
    costUsd: config.estimatedCostPerRunUsd * maxAttempts,
    dailyBudgetUsd: config.dailyBudgetUsd,
    estimatedCostPerRunUsd: config.estimatedCostPerRunUsd,
  });
  const summary = buildMockSummary(input, {
    attempts: maxAttempts,
    latencyMs: Date.now() - startedAt,
    reason: lastError instanceof Error ? lastError.message : "generation_failed",
    traceId,
  });
  recordSummaryEvaluation(summary, input, config);
  return summary;
}

export function readAiSummaryDiagnostics(limit = 20) {
  return listRuntimeDiagnostics(limit, "ai.summary");
}

export function readAiSummaryBudgetSnapshot() {
  const config = getRuntimeConfig();
  return getAiSummaryBudgetSnapshot({
    dailyBudgetUsd: config.dailyBudgetUsd,
    estimatedCostPerRunUsd: config.estimatedCostPerRunUsd,
  });
}

export function __setAiServiceTestClient(client: Pick<OpenAI, "responses"> | null) {
  testClient = client;
}

export function __setAiServiceTestConfig(config: AiSummaryRuntimeConfig | null) {
  testConfig = config;
}

export function __clearAiSummaryBudgetForTests() {
  clearAiSummaryBudgetForTests();
}
