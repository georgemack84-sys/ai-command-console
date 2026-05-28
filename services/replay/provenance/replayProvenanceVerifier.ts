import type { HistoricalReplaySnapshot, ReplayFailure } from "../replayTypes";
import { hashGovernanceEvidence, hashGovernanceLineage, hashGovernanceProvenance } from "../hashing/replayHasher";

function buildFailure(code: ReplayFailure["code"], message: string, path?: string, expected?: unknown, actual?: unknown): ReplayFailure {
  return { code, message, path, expected, actual };
}

export function verifyReplayProvenance(snapshot: HistoricalReplaySnapshot): readonly ReplayFailure[] {
  const failures: ReplayFailure[] = [];

  if (!snapshot.governance) {
    failures.push(buildFailure("REPLAY_GOVERNANCE_STATE_MISSING", "historical replay governance state is missing", "governance"));
    return failures;
  }

  const lineageHash = hashGovernanceLineage(snapshot.governance.lineageNode);
  if (lineageHash !== snapshot.lineageHash) {
    failures.push(buildFailure("REPLAY_PROVENANCE_INVALID", "historical replay lineage hash is invalid", "lineageHash", snapshot.lineageHash, lineageHash));
  }

  const provenanceHash = hashGovernanceProvenance(snapshot.governance);
  if (provenanceHash !== snapshot.provenanceHash) {
    failures.push(buildFailure("REPLAY_PROVENANCE_INVALID", "historical replay provenance hash is invalid", "provenanceHash", snapshot.provenanceHash, provenanceHash));
  }

  const evidenceHash = hashGovernanceEvidence(snapshot.governance);
  if (evidenceHash !== snapshot.evidenceHash) {
    failures.push(buildFailure("REPLAY_HASH_MISMATCH", "historical replay evidence hash is invalid", "evidenceHash", snapshot.evidenceHash, evidenceHash));
  }

  return failures;
}
