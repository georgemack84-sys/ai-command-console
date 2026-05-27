import { createHash } from "node:crypto";

import { serializeMissionGraphValue } from "./graphSerializer";

export function hashMissionGraphValue(scope: string, value: unknown): string {
  return createHash("sha256")
    .update(scope, "utf8")
    .update(":", "utf8")
    .update(serializeMissionGraphValue(value), "utf8")
    .digest("hex");
}
