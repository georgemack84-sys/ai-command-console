import { canonicalizeConstitutionalToString } from "./constitutionalCanonicalizer";
import type {
  ConstitutionalVerdict,
  RecommendationLineage,
  RecommendationReplay,
  SemanticFinding,
} from "./types/constitutionalEnforcementTypes";

export function serializeConstitutionalVerdict(value: ConstitutionalVerdict): string {
  return canonicalizeConstitutionalToString(value);
}

export function serializeConstitutionalFinding(value: SemanticFinding): string {
  return canonicalizeConstitutionalToString(value);
}

export function serializeConstitutionalReplay(value: RecommendationReplay): string {
  return canonicalizeConstitutionalToString(value);
}

export function serializeConstitutionalLineage(value: RecommendationLineage): string {
  return canonicalizeConstitutionalToString(value);
}
