import type { NuruPersonalEditionItem } from "@/src/server/services/nuru-personal-edition-service";

export type NuruEditionCalibration = {
  editionSize: number;
  sourceDiversity: number;
  formatDiversity: number;
  topicalConcentration: number;
  groundedExplanationRate: number;
  sourceLinkRate: number;
  noveltyRate: number;
  antiBubble: "PASS" | "NEEDS_MORE_RANGE";
  checks: Array<{ name: string; passed: boolean; detail: string }>;
};

function normalized(value: string) {
  return value.trim().toLocaleLowerCase();
}

/**
 * A deliberately non-engagement scorecard for edition fixtures and release checks.
 * It measures whether an edition is grounded and varied; it never estimates a
 * person's demographic traits or tries to maximize time spent in the product.
 */
export function calibrateNuruPersonalEdition(items: NuruPersonalEditionItem[]): NuruEditionCalibration {
  const sources = new Set(items.map((item) => normalized(item.candidate.sourceFamily)).filter(Boolean));
  const formats = new Set(items.map((item) => item.candidate.type));
  const topicCounts = new Map<string, number>();
  for (const item of items) {
    for (const topic of new Set(item.candidate.topics.map(normalized).filter(Boolean))) {
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
    }
  }
  const topicalConcentration = items.length ? Math.max(0, ...topicCounts.values()) / items.length : 0;
  const groundedExplanationRate = items.length ? items.filter((item) => item.explanation.trim().length > 0 && (item.explanation.includes("Taste Map") || item.explanation.includes("beyond your stated interests"))).length / items.length : 0;
  const sourceLinkRate = items.length ? items.filter((item) => item.candidate.sourceUrl.startsWith("https://")).length / items.length : 0;
  const noveltyRate = items.length ? items.filter((item) => ["SERENDIPITY", "WILDCARD"].includes(item.lane)).length / items.length : 0;
  const antiBubble = items.length >= 4 && sources.size >= 2 && formats.size >= 2 && topicalConcentration <= 0.75 && noveltyRate >= 0.2 ? "PASS" : "NEEDS_MORE_RANGE";
  const checks = [
    { name: "grounded_explanations", passed: groundedExplanationRate === 1, detail: `${Math.round(groundedExplanationRate * 100)}% explain a visible Taste Map connection or deliberate leap.` },
    { name: "source_links", passed: sourceLinkRate === 1, detail: `${Math.round(sourceLinkRate * 100)}% retain a direct HTTPS source link.` },
    { name: "anti_bubble_range", passed: antiBubble === "PASS", detail: `${sources.size} source families, ${formats.size} formats, ${Math.round(topicalConcentration * 100)}% maximum topic concentration.` },
  ];
  return { editionSize: items.length, sourceDiversity: sources.size, formatDiversity: formats.size, topicalConcentration, groundedExplanationRate, sourceLinkRate, noveltyRate, antiBubble, checks };
}
