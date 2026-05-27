import { createHash } from "node:crypto";
import { canonicalizeReplayValue } from "./replayCanonicalizer";

export function hashReplayValue(scope: string, value: unknown): string {
  const hash = createHash("sha256");
  hash.update(scope);
  hash.update(":");
  hash.update(JSON.stringify(canonicalizeReplayValue(value)));
  return hash.digest("hex");
}
