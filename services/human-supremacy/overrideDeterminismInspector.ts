import type { HumanSupremacyError, HumanSupremacyRecord } from "@/types/human-supremacy";
import { createHumanSupremacyError } from "./authorityBoundaryValidator";
import { hashInterventionValue } from "./interventionHasher";
import { serializeInterventionValue } from "./interventionSerializer";

export function inspectOverrideDeterminism(record: HumanSupremacyRecord): readonly HumanSupremacyError[] {
  const firstSerialization = serializeInterventionValue(record);
  const secondSerialization = serializeInterventionValue(record);
  const firstHash = hashInterventionValue("human-supremacy-determinism", record);
  const secondHash = hashInterventionValue("human-supremacy-determinism", record);
  if (firstSerialization === secondSerialization && firstHash === secondHash) {
    return Object.freeze([]);
  }
  return Object.freeze([
    createHumanSupremacyError(
      "HUMAN_SUPREMACY_NON_DETERMINISTIC_OUTPUT",
      "Human supremacy record changed across deterministic inspection.",
      "record",
    ),
  ]);
}
