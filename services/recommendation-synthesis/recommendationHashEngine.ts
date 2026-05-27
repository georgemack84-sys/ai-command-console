import { createHash } from "node:crypto";
import { canonicalizeRecommendationToString } from "./recommendationCanonicalizer";

export function hashRecommendationValue(scope: string, value: unknown): string {
  const hash = createHash("sha256");
  hash.update(scope);
  hash.update(":");
  hash.update(canonicalizeRecommendationToString(value));
  return hash.digest("hex");
}
