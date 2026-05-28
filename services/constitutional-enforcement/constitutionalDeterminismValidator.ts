import { canonicalizeConstitutionalToString } from "./constitutionalCanonicalizer";
import { hashConstitutionalValue } from "./constitutionalHashLinker";
import {
  serializeConstitutionalFinding,
  serializeConstitutionalLineage,
  serializeConstitutionalReplay,
  serializeConstitutionalVerdict,
} from "./constitutionalSerializationEngine";
import type {
  ConstitutionalEnforcementError,
  ConstitutionalVerdict,
  RecommendationLineage,
  RecommendationReplay,
  SemanticFinding,
} from "./types/constitutionalEnforcementTypes";

export function validateConstitutionalDeterminism(input: {
  verdict: ConstitutionalVerdict;
  findings: readonly SemanticFinding[];
  lineage: RecommendationLineage;
  replay: RecommendationReplay;
}): readonly ConstitutionalEnforcementError[] {
  const verdictA = serializeConstitutionalVerdict(input.verdict);
  const verdictB = canonicalizeConstitutionalToString(input.verdict);
  const replayA = serializeConstitutionalReplay(input.replay);
  const replayB = canonicalizeConstitutionalToString(input.replay);
  const lineageA = serializeConstitutionalLineage(input.lineage);
  const lineageB = canonicalizeConstitutionalToString(input.lineage);
  const findingHashes = input.findings.map((finding) => hashConstitutionalValue(
    "constitutional-enforcement-finding-hash",
    serializeConstitutionalFinding(finding),
  ));
  const mirroredFindingHashes = input.findings.map((finding) => hashConstitutionalValue(
    "constitutional-enforcement-finding-hash",
    canonicalizeConstitutionalToString(finding),
  ));

  if (
    verdictA !== verdictB
    || replayA !== replayB
    || lineageA !== lineageB
    || JSON.stringify(findingHashes) !== JSON.stringify(mirroredFindingHashes)
  ) {
    return Object.freeze([{
      code: "CONSTITUTIONAL_ENFORCEMENT_NON_DETERMINISTIC" as const,
      message: "Constitutional enforcement serialization or hashing drifted under deterministic replay validation.",
      path: "determinism",
    }]);
  }

  return Object.freeze([]);
}
