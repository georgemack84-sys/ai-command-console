import { createHash } from "node:crypto";
import { canonicalizeHiddenExecutionToString } from "./hiddenExecutionCanonicalizer";

export function hashHiddenExecutionValue(scope: string, value: unknown): string {
  const hash = createHash("sha256");
  hash.update(scope);
  hash.update(":");
  hash.update(canonicalizeHiddenExecutionToString(value));
  return hash.digest("hex");
}
