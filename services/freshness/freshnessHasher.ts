import crypto from "node:crypto";
import { serializeFreshnessValue } from "./freshnessSerializer";

export function hashFreshnessValue(namespace: string, value: unknown): string {
  return crypto.createHash("sha256").update(`${namespace}:${serializeFreshnessValue(value)}`).digest("hex");
}
