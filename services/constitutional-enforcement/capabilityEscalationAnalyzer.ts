import type { SemanticFinding } from "./types/constitutionalEnforcementTypes";

const ESCALATION_PATTERNS = [
  "authorize",
  "grant permission",
  "elevate",
  "unlock capability",
  "bypass approval",
  "acquire permission",
  "privilege expansion",
  "governance bypass",
  "role elevation",
] as const;

export function analyzeCapabilityEscalation(input: {
  recommendationId: string;
  text: string;
  evidenceReferences: readonly string[];
  detectedAt: string;
}): readonly SemanticFinding[] {
  const corpus = input.text.toLowerCase();
  const findings: SemanticFinding[] = [];

  for (const pattern of ESCALATION_PATTERNS) {
    if (!corpus.includes(pattern)) {
      continue;
    }
    findings.push(Object.freeze({
      findingId: `${input.recommendationId}:capability:${pattern.replace(/\s+/g, "-")}`,
      category: "capability_escalation" as const,
      severity: "critical" as const,
      description: `Capability escalation semantic detected: "${pattern}".`,
      evidenceReferences: [...input.evidenceReferences],
      detectedAt: input.detectedAt,
    }));
  }

  return Object.freeze(findings);
}
