import { buildCoordinationReadinessCertification } from "@/services/coordination-readiness-certification";
import type {
  CertificationLineage,
  CertificationReplayLedgerEntry,
  CoordinationReadinessCertificationInput,
} from "@/types/coordination-readiness-certification";
import { buildCoordinationBoundaryFixture } from "@/tests/integration/coordination-boundary-enforcement/helpers";

export function buildCoordinationReadinessFixture(overrides: Partial<{
  createdAt: string;
  metadata: Readonly<Record<string, unknown>>;
  existingLineage: CertificationLineage;
  existingReplayLedger: readonly CertificationReplayLedgerEntry[];
}> = {}) {
  const boundaryFixture = buildCoordinationBoundaryFixture({
    createdAt: overrides.createdAt,
    metadata: overrides.metadata,
  });

  const input: CoordinationReadinessCertificationInput = Object.freeze({
    certificationId: `certification-${boundaryFixture.input.coordinationRecord.coordinationId}`,
    coordinationRecord: boundaryFixture.input.coordinationRecord,
    routingResult: boundaryFixture.input.routingResult,
    orchestrationRecord: boundaryFixture.input.orchestrationRecord,
    coordinationReplay: boundaryFixture.input.coordinationReplay,
    escalationResult: boundaryFixture.input.escalationResult,
    overrideResult: boundaryFixture.input.overrideResult,
    boundaryResult: boundaryFixture.result,
    createdAt: overrides.createdAt ?? "2026-05-17T17:00:00.000Z",
    existingLineage: overrides.existingLineage,
    existingReplayLedger: overrides.existingReplayLedger,
    metadata: overrides.metadata,
  });

  return {
    boundaryFixture,
    input,
    result: buildCoordinationReadinessCertification(input),
  };
}
