import { createHash } from "node:crypto";
import { serializeReadinessValue } from "./readinessSerializer";

export function hashReadinessValue(namespace: string, value: unknown): string {
  return createHash("sha256")
    .update(namespace.normalize("NFC"))
    .update("::4.5J::")
    .update(serializeReadinessValue(value))
    .digest("hex");
}
