import type { CertificationLineage, CertificationLineageEntry } from "@/types/coordination-readiness-certification";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function appendCertificationLineage(input: {
  existing?: CertificationLineage;
  entry: CertificationLineageEntry;
}): CertificationLineage {
  const entries = Object.freeze([
    ...(input.existing?.entries ?? []),
    input.entry,
  ].sort((left, right) => {
    if (left.createdAt !== right.createdAt) {
      return left.createdAt.localeCompare(right.createdAt);
    }
    return left.entryId.localeCompare(right.entryId);
  }));

  return Object.freeze({
    lineageId: input.existing?.lineageId ?? hashCoordinationReplayValue("coordination-readiness-lineage-id", entries[0]?.entryId ?? "empty"),
    entries,
    lineageHash: hashCoordinationReplayValue("coordination-readiness-lineage", entries),
  });
}
