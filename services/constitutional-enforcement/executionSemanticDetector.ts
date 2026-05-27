import type { SemanticFinding } from "./types/constitutionalEnforcementTypes";

const EXECUTION_PATTERNS = [
  "automatically restart",
  "execute ",
  "dispatch",
  "invoke adapter",
  "call worker",
  "queue ",
  "retry until successful",
  "activate fallback orchestration",
  "background execution",
  "execution delegation",
  "autonomous remediation",
] as const;

export function detectExecutionSemantics(input: {
  recommendationId: string;
  text: string;
  evidenceReferences: readonly string[];
  detectedAt: string;
}): readonly SemanticFinding[] {
  const corpus = input.text.toLowerCase();
  const findings: SemanticFinding[] = [];

  for (const pattern of EXECUTION_PATTERNS) {
    if (!corpus.includes(pattern)) {
      continue;
    }
    findings.push(Object.freeze({
      findingId: `${input.recommendationId}:execution:${pattern.replace(/\s+/g, "-")}`,
      category: "execution" as const,
      severity: "critical" as const,
      description: `Execution semantic detected: "${pattern}".`,
      evidenceReferences: [...input.evidenceReferences],
      detectedAt: input.detectedAt,
    }));
  }

  return Object.freeze(findings);
}
