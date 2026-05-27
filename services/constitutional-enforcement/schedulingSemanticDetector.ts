import type { SemanticFinding } from "./types/constitutionalEnforcementTypes";

const SCHEDULING_PATTERNS = [
  "every 5 minutes",
  "cron",
  "interval",
  "delayed execution",
  "schedule ",
  "scheduled ",
  "polling",
  "recurring",
  "deferred execution",
  "retry ",
] as const;

export function detectSchedulingSemantics(input: {
  recommendationId: string;
  text: string;
  evidenceReferences: readonly string[];
  detectedAt: string;
}): readonly SemanticFinding[] {
  const corpus = input.text.toLowerCase();
  const findings: SemanticFinding[] = [];

  for (const pattern of SCHEDULING_PATTERNS) {
    if (!corpus.includes(pattern)) {
      continue;
    }
    findings.push(Object.freeze({
      findingId: `${input.recommendationId}:scheduling:${pattern.replace(/\s+/g, "-")}`,
      category: "scheduling" as const,
      severity: "critical" as const,
      description: `Scheduling semantic detected: "${pattern}".`,
      evidenceReferences: [...input.evidenceReferences],
      detectedAt: input.detectedAt,
    }));
  }

  return Object.freeze(findings);
}
