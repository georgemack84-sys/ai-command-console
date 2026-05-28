import { createHash } from "node:crypto";
import { canonicalizeDecisionEpisodeValue } from "./decisionEpisodeCanonicalizer";

export function hashDecisionEpisodeValue(scope: string, value: unknown): string {
  const hash = createHash("sha256");
  hash.update(scope);
  hash.update(":");
  hash.update(JSON.stringify(canonicalizeDecisionEpisodeValue(value)));
  return hash.digest("hex");
}
