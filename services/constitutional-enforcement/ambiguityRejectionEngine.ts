import type {
  ConstitutionalEnforcementErrorCode,
  SemanticFinding,
} from "./types/constitutionalEnforcementTypes";

const AMBIGUITY_PATTERNS = [
  "maybe",
  "might",
  "could",
  "potentially",
  "if possible",
  "as needed",
  "where appropriate",
  "optionally trigger",
  "consider automatically",
] as const;

export const AMBIGUITY_REJECTION_THRESHOLD = 20;

export function evaluateSemanticAmbiguity(input: {
  recommendationId: string;
  text: string;
  evidenceReferences: readonly string[];
  detectedAt: string;
  lineageComplete: boolean;
  governanceConsistent: boolean;
  replayConsistent: boolean;
  semanticFindings: readonly SemanticFinding[];
}): {
  ambiguityScore: number;
  findings: readonly SemanticFinding[];
  rejectionReasons: readonly string[];
  freezeReasons: readonly ConstitutionalEnforcementErrorCode[];
} {
  const corpus = input.text.toLowerCase();
  let ambiguityScore = 0;
  const rejectionReasons: string[] = [];
  const freezeReasons: ConstitutionalEnforcementErrorCode[] = [];
  const findings: SemanticFinding[] = [];

  for (const pattern of AMBIGUITY_PATTERNS) {
    if (!corpus.includes(pattern)) {
      continue;
    }
    ambiguityScore += 8;
    rejectionReasons.push(`Ambiguous semantic phrase detected: "${pattern}".`);
  }

  if (!input.lineageComplete) {
    ambiguityScore += 30;
    rejectionReasons.push("Replay-safe lineage is incomplete.");
    freezeReasons.push("CONSTITUTIONAL_ENFORCEMENT_LINEAGE_GAP");
  }
  if (!input.governanceConsistent) {
    ambiguityScore += 30;
    rejectionReasons.push("Governance correlation is inconsistent.");
    freezeReasons.push("CONSTITUTIONAL_ENFORCEMENT_GOVERNANCE_MISMATCH");
  }
  if (!input.replayConsistent) {
    ambiguityScore += 30;
    rejectionReasons.push("Replay reconstruction is inconsistent.");
    freezeReasons.push("CONSTITUTIONAL_ENFORCEMENT_REPLAY_INVALID");
  }
  if (input.semanticFindings.length > 0) {
    ambiguityScore += input.semanticFindings.length * 6;
  }

  const finalScore = Math.min(100, ambiguityScore);
  if (finalScore > 0) {
    findings.push(Object.freeze({
      findingId: `${input.recommendationId}:ambiguity`,
      category: "ambiguity" as const,
      severity: finalScore >= AMBIGUITY_REJECTION_THRESHOLD ? "high" as const : "medium" as const,
      description: `Semantic ambiguity score reached ${finalScore}.`,
      evidenceReferences: [...input.evidenceReferences],
      detectedAt: input.detectedAt,
    }));
    rejectionReasons.push(`Semantic ambiguity score ${finalScore} reached constitutional containment threshold.`);
    freezeReasons.push("CONSTITUTIONAL_ENFORCEMENT_AMBIGUITY_DETECTED");
  }

  return {
    ambiguityScore: finalScore,
    findings: Object.freeze(findings),
    rejectionReasons: Object.freeze(rejectionReasons),
    freezeReasons: Object.freeze(freezeReasons),
  };
}
