import type { SemanticFinding } from "./types/constitutionalEnforcementTypes";

const ORCHESTRATION_PATTERNS = [
  "workflow",
  "pipeline stage",
  "sequence execution",
  "coordinate dependencies",
  "multi-stage",
  "recursive workflow",
  "distributed operational coordination",
  "orchestrate",
  "orchestration",
  "autonomous workflow progression",
] as const;

export function detectOrchestrationSemantics(input: {
  recommendationId: string;
  text: string;
  evidenceReferences: readonly string[];
  detectedAt: string;
}): readonly SemanticFinding[] {
  const corpus = input.text.toLowerCase();
  const findings: SemanticFinding[] = [];

  for (const pattern of ORCHESTRATION_PATTERNS) {
    if (!corpus.includes(pattern)) {
      continue;
    }
    findings.push(Object.freeze({
      findingId: `${input.recommendationId}:orchestration:${pattern.replace(/\s+/g, "-")}`,
      category: "orchestration" as const,
      severity: "critical" as const,
      description: `Orchestration semantic detected: "${pattern}".`,
      evidenceReferences: [...input.evidenceReferences],
      detectedAt: input.detectedAt,
    }));
  }

  return Object.freeze(findings);
}
