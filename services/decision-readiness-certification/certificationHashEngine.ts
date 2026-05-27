import { createHash } from "node:crypto";
import { canonicalizeCertificationValue } from "./certificationCanonicalizer";

export function hashCertificationValue(scope: string, value: unknown): string {
  const hash = createHash("sha256");
  hash.update(scope);
  hash.update(":");
  hash.update(JSON.stringify(canonicalizeCertificationValue(value)));
  return hash.digest("hex");
}
