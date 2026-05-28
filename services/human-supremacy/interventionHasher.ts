import { createHash } from "node:crypto";

import { serializeInterventionValue } from "./interventionSerializer";

export function hashInterventionValue(scope: string, value: unknown): string {
  return createHash("sha256")
    .update(scope, "utf8")
    .update(":", "utf8")
    .update(serializeInterventionValue(value), "utf8")
    .digest("hex");
}
