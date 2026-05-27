import type { AntiEmergenceError, AntiEmergenceInput, AntiEmergenceContainmentState } from "./antiEmergenceStateTypes";
import { normalizeAntiEmergenceMetadata } from "./antiEmergenceSchemas";
import { hashEmergenceValue } from "./emergenceHashingEngine";

export function validateEmergenceContainment(input: AntiEmergenceInput): readonly AntiEmergenceError[] {
  const normalized = normalizeAntiEmergenceMetadata(input.metadata);
  if (
    input.humanSupremacyResult.record.failClosed
    || input.escalationDeterminismResult.record.failClosed
    || normalized.includes("containmentmutation")
    || normalized.includes("containmentdrift")
  ) {
    return Object.freeze([Object.freeze({
      code: "ANTI_EMERGENCE_CONTAINMENT_DRIFT",
      message: "Containment mutation, drift, or inherited fail-closed containment markers were detected.",
      path: "humanSupremacyResult.record.failClosed",
    })]);
  }
  return Object.freeze([]);
}

export function buildContainmentState(input: {
  containmentId: string;
  classification: AntiEmergenceContainmentState["classification"];
}): AntiEmergenceContainmentState {
  const freezeRequired = input.classification !== "contained";
  return Object.freeze({
    classification: input.classification,
    freezeRequired,
    approvalsInvalidated: freezeRequired,
    topologyFrozen: freezeRequired,
    containmentHash: hashEmergenceValue("anti-emergence-containment-state", input),
  });
}
