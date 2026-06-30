import { EdgeBookError } from "../../../core";

export type ObservationMutationAction =
  | "UPDATE_RAW_OBSERVATION"
  | "DELETE_RAW_OBSERVATION"
  | "REPLACE_RAW_PAYLOAD"
  | "UPDATE_OWNERSHIP_RECORD"
  | "UPDATE_SOURCE_REFERENCE"
  | "UPDATE_VALIDATION_RECORD"
  | "REWRITE_VALIDATION_RESULT"
  | "REWRITE_STORAGE_HISTORY";

export const blockedObservationMutationActions: ReadonlySet<ObservationMutationAction> = new Set([
  "UPDATE_RAW_OBSERVATION",
  "DELETE_RAW_OBSERVATION",
  "REPLACE_RAW_PAYLOAD",
  "UPDATE_OWNERSHIP_RECORD",
  "UPDATE_SOURCE_REFERENCE",
  "UPDATE_VALIDATION_RECORD",
  "REWRITE_VALIDATION_RESULT",
  "REWRITE_STORAGE_HISTORY",
]);

export function assertObservationMutationBlocked(action: ObservationMutationAction): never {
  throw new EdgeBookError("PHASE_BOUNDARY_VIOLATION", `${action} is blocked by the append-only observation store.`, "action");
}

export function rejectTransformedRawPayload(input: {
  raw_payload: unknown;
  replacement_payload?: unknown;
}): { status: "VALID" } | { status: "REJECTED"; reason: string } {
  if (input.replacement_payload !== undefined && input.replacement_payload !== input.raw_payload) {
    return {
      status: "REJECTED",
      reason: "Transformed data cannot replace raw_payload.",
    };
  }

  return { status: "VALID" };
}
