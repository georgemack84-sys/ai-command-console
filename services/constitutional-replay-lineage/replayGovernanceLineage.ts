import { hashConstitutionalReplayValue } from "@/services/constitutional-replay-attack/deterministicReplayHasher";

export function buildReplayGovernanceLineage(input: {
  governanceSnapshotId: string;
  governanceLinked: boolean;
}) {
  return Object.freeze({
    governanceSnapshotId: input.governanceSnapshotId,
    governanceLinked: input.governanceLinked,
    governanceHash: hashConstitutionalReplayValue("governance-lineage", input),
  });
}
