import type { ConfidenceRiskProfile } from "@/types/escalation";
import { hashEscalationCoordinationValue } from "@/services/escalation/escalationHasher";

export type ConfidenceStateSnapshot = Readonly<{
  snapshotId: string;
  profile: ConfidenceRiskProfile;
  snapshotHash: string;
}>;

export function persistConfidenceState(profile: ConfidenceRiskProfile): ConfidenceStateSnapshot {
  return Object.freeze({
    snapshotId: hashEscalationCoordinationValue("confidence-state-snapshot-id", {
      coordinationId: profile.coordinationId,
      updatedAt: profile.updatedAt,
    }),
    profile,
    snapshotHash: hashEscalationCoordinationValue("confidence-state-snapshot", profile),
  });
}
