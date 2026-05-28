import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";

import type {
  NormalizationEvidence,
  NormalizationEvent,
} from "./normalization-types";

export function orderNormalizationEvents(
  events: NormalizationEvent[],
): NormalizationEvent[] {
  return [...events].sort((left, right) =>
    left.path.localeCompare(right.path)
    || left.action.localeCompare(right.action)
    || left.reason.localeCompare(right.reason)
    || left.eventId.localeCompare(right.eventId));
}

export function createNormalizationRunId(input: {
  planId: string;
  graphHash: string;
  validationHash: string;
  normalizationVersion: string;
}): string {
  return `normalization:${hashPayloadDeterministically(input)}`;
}

export function createNormalizationEvidencePayload(
  input: Omit<NormalizationEvidence, "immutableAuditLedgerId">,
): Omit<NormalizationEvidence, "immutableAuditLedgerId"> {
  return input;
}
