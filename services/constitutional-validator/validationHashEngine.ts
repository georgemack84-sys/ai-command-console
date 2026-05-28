import { createHash } from "node:crypto";
import { canonicalizeValidationValue } from "./validationCanonicalizer";

export function hashValidationValue(scope: string, value: unknown): string {
  const hash = createHash("sha256");
  hash.update(scope);
  hash.update(":");
  hash.update(JSON.stringify(canonicalizeValidationValue(value)));
  return hash.digest("hex");
}
