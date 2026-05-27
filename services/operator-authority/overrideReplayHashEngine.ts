import { createHash } from "node:crypto";
import { canonicalizeOverrideValue } from "./overrideCanonicalizer";

export function hashOverrideReplayValue(scope: string, value: unknown): string {
  const hash = createHash("sha256");
  hash.update(scope);
  hash.update(":");
  hash.update(JSON.stringify(canonicalizeOverrideValue(value)));
  return hash.digest("hex");
}
