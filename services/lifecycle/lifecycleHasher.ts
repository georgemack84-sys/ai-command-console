import crypto from "node:crypto";
import { serializeLifecycleValue } from "./lifecycleSerializer";

export function buildLifecycleHash(namespace: string, value: unknown): string {
  return crypto.createHash("sha256").update(`${namespace}:${serializeLifecycleValue(value)}`).digest("hex");
}
