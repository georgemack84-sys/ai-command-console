import crypto from "node:crypto";
import { serializeEscalationValue } from "./escalationSerializer";

export function hashEscalationCoordinationValue(namespace: string, value: unknown): string {
  return crypto.createHash("sha256").update(`${namespace}:${serializeEscalationValue(value)}`).digest("hex");
}
