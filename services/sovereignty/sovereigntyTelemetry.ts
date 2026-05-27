import type { OperationalSovereigntyAssessment } from "./operationalSovereigntyEngine";

export type SovereigntyTelemetrySnapshot = {
  snapshotId: string;
  createdAt: string;
  assessment: OperationalSovereigntyAssessment;
  advisoryOnly: true;
};

export function buildSovereigntyTelemetrySnapshot(input: {
  assessment: OperationalSovereigntyAssessment;
  createdAt: string;
}): SovereigntyTelemetrySnapshot {
  return {
    snapshotId: `sovereignty:${input.createdAt}:${input.assessment.sovereigntyState.toLowerCase()}`,
    createdAt: input.createdAt,
    assessment: input.assessment,
    advisoryOnly: true,
  };
}
