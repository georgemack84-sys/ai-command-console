import { createHash } from "node:crypto";
import { serializeEscalationValue } from "./escalationSerializer";

export function hashEscalationValue(namespace: string, value: unknown): string {
  return createHash("sha256")
    .update(namespace.normalize("NFC"))
    .update("::4.5I::")
    .update(serializeEscalationValue(value))
    .digest("hex");
}
