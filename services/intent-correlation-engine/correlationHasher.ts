import { createHash } from "node:crypto";
import { serializeCorrelationValue } from "./correlationSerializer";

export function hashCorrelationValue(namespace: string, value: unknown): string {
  return createHash("sha256")
    .update(namespace.normalize("NFC"))
    .update("::4.6B::")
    .update(serializeCorrelationValue(value))
    .digest("hex");
}
