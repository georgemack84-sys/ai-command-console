import { createHash } from "node:crypto";
import { serializeCoordinationValue } from "./coordinationSerializer";

export function hashCoordinationGovernanceValue(namespace: string, value: unknown): string {
  return createHash("sha256")
    .update(namespace.normalize("NFC"))
    .update("::4.6A::")
    .update(serializeCoordinationValue(value))
    .digest("hex");
}
