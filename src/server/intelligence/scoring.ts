import type { MonitoredUpdate, Source } from "@prisma/client";

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 40,
  high: 30,
  medium: 20,
  low: 10,
};

const SOURCE_TYPE_WEIGHT: Record<string, number> = {
  feed: 10,
  integration: 15,
  repository: 12,
  website: 8,
  document: 6,
};

const KEYWORD_WEIGHTS: Array<{ keyword: RegExp; score: number }> = [
  { keyword: /outage|incident|breach/i, score: 20 },
  { keyword: /launch|release|shipment/i, score: 8 },
  { keyword: /risk|delay|blocked/i, score: 6 },
];

export function scoreInsight(update: MonitoredUpdate, source?: Source | null) {
  const severityScore = SEVERITY_WEIGHT[update.severity] ?? 0;
  const sourceScore = source ? SOURCE_TYPE_WEIGHT[source.type] ?? 5 : 5;
  const freshnessMinutes = Math.max(1, Math.round((Date.now() - update.happenedAt.getTime()) / 60_000));
  const freshnessScore = Math.max(0, 20 - Math.floor(freshnessMinutes / 30));
  const content = `${update.title} ${update.summary}`.trim();
  const keywordScore = KEYWORD_WEIGHTS.reduce((total, entry) => (entry.keyword.test(content) ? total + entry.score : total), 0);

  const totalScore = Math.max(0, severityScore + sourceScore + freshnessScore + keywordScore);
  return {
    totalScore,
    severityScore,
    sourceScore,
    freshnessScore,
    keywordScore,
  };
}
