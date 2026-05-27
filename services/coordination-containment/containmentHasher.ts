import { createHash } from "node:crypto";

import { serializeContainmentValue } from "./containmentSerializer";

export function hashContainmentValue(namespace: string, value: unknown): string {
  return createHash("sha256")
    .update(namespace)
    .update(":")
    .update(serializeContainmentValue(value))
    .digest("hex");
}
