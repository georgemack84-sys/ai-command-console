import { createHash } from "node:crypto";
import { canonicalizeTransitionValue } from "./transitionCanonicalizer";

export function hashConstitutionalTransitionValue(scope: string, value: unknown): string {
  const hash = createHash("sha256");
  hash.update(scope);
  hash.update(":");
  hash.update(JSON.stringify(canonicalizeTransitionValue(value)));
  return hash.digest("hex");
}
