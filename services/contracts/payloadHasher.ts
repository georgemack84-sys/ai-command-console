import crypto from "node:crypto";

import { canonicalSerialize } from "./canonicalSerializer";

export function hashPayloadDeterministically(value: unknown) {
  return crypto.createHash("sha256").update(canonicalSerialize(value)).digest("hex");
}
