import type {
  ConstitutionalEnforcementError,
  SemanticFinding,
} from "./types/constitutionalEnforcementTypes";

const ANTI_EMERGENCE_PATTERNS = [
  "self-directed",
  "autonomous",
  "without approval",
  "recursively coordinate",
  "capability expansion",
  "self-authorize",
  "hidden autonomy",
  "self-healing",
  "dynamically reinterpret",
  "regenerate confidence",
] as const;

export function validateConstitutionalAntiEmergence(input: {
  recommendationId: string;
  text: string;
  semanticFindings: readonly SemanticFinding[];
}): readonly ConstitutionalEnforcementError[] {
  const corpus = input.text.toLowerCase();
  const errors: ConstitutionalEnforcementError[] = [];

  for (const pattern of ANTI_EMERGENCE_PATTERNS) {
    if (!corpus.includes(pattern)) {
      continue;
    }
    errors.push({
      code: "CONSTITUTIONAL_ENFORCEMENT_ANTI_EMERGENCE",
      message: `Anti-emergence semantic detected: "${pattern}".`,
      path: `recommendation.${input.recommendationId}`,
    });
  }

  if (input.semanticFindings.some((finding) => finding.category === "execution" || finding.category === "orchestration")) {
    errors.push({
      code: "CONSTITUTIONAL_ENFORCEMENT_ANTI_EMERGENCE",
      message: "Hidden execution or orchestration semantics violate anti-emergence containment.",
      path: `recommendation.${input.recommendationId}.semanticFindings`,
    });
  }

  return Object.freeze(errors);
}
