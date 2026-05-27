import type { LifecycleError, LifecycleTransitionRecord } from "@/types/lifecycle";
import { buildLifecycleHash } from "./lifecycleHasher";
import { serializeLifecycleValue } from "./lifecycleSerializer";
import { createLifecycleError } from "./lifecycleBoundaryGuards";

export function inspectLifecycleDeterminism(record: LifecycleTransitionRecord): readonly LifecycleError[] {
  const left = serializeLifecycleValue(record);
  const right = serializeLifecycleValue(record);
  const leftHash = buildLifecycleHash("lifecycle-determinism-check", record);
  const rightHash = buildLifecycleHash("lifecycle-determinism-check", record);

  return Object.freeze(
    left !== right || leftHash !== rightHash
      ? [createLifecycleError(
        "LIFECYCLE_NON_DETERMINISTIC_OUTPUT",
        "Lifecycle record serialization or hashing is non-deterministic.",
        "record",
      )]
      : [],
  );
}
