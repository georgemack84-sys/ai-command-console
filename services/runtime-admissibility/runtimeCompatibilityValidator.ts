import type { RuntimeCompatibilityRecord } from "./runtimeAdmissibilityStateTypes";
import { hashRuntimeCertificationValue } from "./runtimeCertificationHashingEngine";

export function buildRuntimeCompatibilityRecord(input: Omit<RuntimeCompatibilityRecord, "deterministicHash">): RuntimeCompatibilityRecord {
  return Object.freeze({
    ...input,
    deterministicHash: hashRuntimeCertificationValue("runtime-admissibility-compatibility", input),
  });
}
