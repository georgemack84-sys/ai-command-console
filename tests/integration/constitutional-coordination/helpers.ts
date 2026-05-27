import { buildConstitutionalCoordinationCore } from "@/services/constitutional-coordination/coordinationCore";
import { buildContainmentFixture } from "@/tests/coordination-containment/helpers";

export function buildConstitutionalCoordinationFixture(overrides: Partial<{
  createdAt: string;
  metadata: Readonly<Record<string, unknown>>;
  containmentRecord: ReturnType<typeof buildContainmentFixture>["record"];
  existingChronology: ReturnType<typeof buildConstitutionalCoordinationCore>["chronology"];
}> = {}) {
  const containmentFixture = buildContainmentFixture({
    createdAt: overrides.createdAt,
    metadata: overrides.metadata,
  });
  const record = buildConstitutionalCoordinationCore({
    coordinationId: containmentFixture.input.coordinationId,
    proposal: containmentFixture.missionFixture.input.proposal,
    lifecycle: containmentFixture.input.lifecycle,
    escalationRecord: containmentFixture.input.escalationRecord,
    missionGraph: containmentFixture.input.missionGraph,
    containmentRecord: overrides.containmentRecord ?? containmentFixture.record,
    humanSupremacyRecord: containmentFixture.humanSupremacyRecord,
    createdAt: overrides.createdAt ?? containmentFixture.input.createdAt,
    existingChronology: overrides.existingChronology,
    metadata: overrides.metadata,
  });

  return {
    containmentFixture,
    record,
  };
}
