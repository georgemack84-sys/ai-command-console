import { hashConstitutionalValue } from "./constitutionalHashLinker";
import { AMBIGUITY_REJECTION_THRESHOLD } from "./ambiguityRejectionEngine";
import type { ConstitutionalVerdict, SemanticFinding } from "./types/constitutionalEnforcementTypes";

export function buildConstitutionalVerdict(input: {
  recommendationId: string;
  evaluatedAt: string;
  semanticFindings: readonly SemanticFinding[];
  ambiguityScore: number;
  rejectionReasons: readonly string[];
}): ConstitutionalVerdict {
  const hasBlockingFinding = input.semanticFindings.some((finding) =>
    finding.category !== "ambiguity" && (finding.severity === "high" || finding.severity === "critical"),
  );
  const ambiguous = input.ambiguityScore >= AMBIGUITY_REJECTION_THRESHOLD
    || input.semanticFindings.some((finding) => finding.category === "ambiguity");

  const status = hasBlockingFinding
    ? "BLOCKED"
    : ambiguous
      ? "REJECTED"
      : "APPROVED";

  const verdictId = `constitutional-verdict:${input.recommendationId}:${hashConstitutionalValue(
    "constitutional-verdict-id",
    { status, evaluatedAt: input.evaluatedAt },
  ).slice(0, 12)}`;

  return Object.freeze({
    verdictId,
    recommendationId: input.recommendationId,
    status,
    rejectionReasons: [...input.rejectionReasons],
    semanticFindings: [...input.semanticFindings],
    ambiguityScore: input.ambiguityScore,
    evaluatedAt: input.evaluatedAt,
    executionAuthorized: false as const,
    runtimeMutationOccurred: false as const,
    scheduledActionCreated: false as const,
    authorityChanged: false as const,
  });
}
