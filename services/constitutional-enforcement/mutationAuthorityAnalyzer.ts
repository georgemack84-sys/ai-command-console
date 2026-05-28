import type { SemanticFinding } from "./types/constitutionalEnforcementTypes";

const MUTATION_PATTERNS = [
  "modify runtime",
  "update policy",
  "rewrite governance",
  "mutate",
  "change database",
  "patch approval",
  "rewrite replay",
  "edit telemetry",
  "runtime mutation",
] as const;

export function analyzeMutationAuthority(input: {
  recommendationId: string;
  text: string;
  evidenceReferences: readonly string[];
  detectedAt: string;
}): readonly SemanticFinding[] {
  const corpus = input.text.toLowerCase();
  const findings: SemanticFinding[] = [];

  for (const pattern of MUTATION_PATTERNS) {
    if (!corpus.includes(pattern)) {
      continue;
    }
    findings.push(Object.freeze({
      findingId: `${input.recommendationId}:mutation:${pattern.replace(/\s+/g, "-")}`,
      category: "mutation" as const,
      severity: "critical" as const,
      description: `Mutation authority semantic detected: "${pattern}".`,
      evidenceReferences: [...input.evidenceReferences],
      detectedAt: input.detectedAt,
    }));
  }

  return Object.freeze(findings);
}
