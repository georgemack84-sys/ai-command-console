import { createHash } from "node:crypto";
import { canonicalizeProposalValue } from "./proposalCanonicalizer";

export function hashProposalIntegrityValue(scope: string, value: unknown): string {
  const hash = createHash("sha256");
  hash.update(scope);
  hash.update(":");
  hash.update(JSON.stringify(canonicalizeProposalValue(value)));
  return hash.digest("hex");
}
