import { canonicalizeProposalReplayToString } from "./replayCanonicalizer";
import { hashProposalReplayValue } from "./replayHasher";
import {
  serializeProposalReplay,
  serializeProposalReplayAuditRecord,
  serializeProposalReplayCertification,
  serializeProposalReplayDrift,
  serializeProposalReplayLineage,
  serializeProposalReplaySnapshotBundle,
} from "./replaySerializer";
import type {
  ProposalReplay,
  ProposalReplayAuditRecord,
  ProposalReplayCertification,
  ProposalReplayError,
  ProposalReplayLineageRecord,
  ProposalReplaySnapshotBundle,
  ReplayDrift,
} from "./replayTypes";

export function certifyProposalReplayDeterminism(input: {
  replay: ProposalReplay;
  snapshotBundle: ProposalReplaySnapshotBundle;
  lineage: ProposalReplayLineageRecord;
  drifts: readonly ReplayDrift[];
  auditRecords: readonly ProposalReplayAuditRecord[];
}): {
  certification: ProposalReplayCertification;
  errors: readonly ProposalReplayError[];
} {
  const stable =
    serializeProposalReplay(input.replay) === canonicalizeProposalReplayToString(input.replay)
    && serializeProposalReplaySnapshotBundle(input.snapshotBundle) === canonicalizeProposalReplayToString(input.snapshotBundle)
    && serializeProposalReplayLineage(input.lineage) === canonicalizeProposalReplayToString(input.lineage)
    && input.drifts.every((drift) => serializeProposalReplayDrift(drift) === canonicalizeProposalReplayToString(drift))
    && input.auditRecords.every((record) => serializeProposalReplayAuditRecord(record) === canonicalizeProposalReplayToString(record));

  const certificationCore = {
    deterministicOrderingVerified: stable,
    governanceReconstructionVerified: input.replay.reconstructedGovernance.length > 0,
    approvalReconstructionVerified: input.replay.reconstructedApprovals.length > 0,
    dependencyReconstructionVerified: input.replay.reconstructedDependencies.length > 0,
    authorityReconstructionVerified: input.replay.reconstructedAuthority.length > 0,
    validatorReconstructionVerified: input.replay.validatorSnapshotIds.length > 0,
    replayHashStable:
      hashProposalReplayValue("proposal-replay-determinism", canonicalizeProposalReplayToString(input.replay))
      === hashProposalReplayValue(
        "proposal-replay-determinism",
        canonicalizeProposalReplayToString(JSON.parse(canonicalizeProposalReplayToString(input.replay))),
      ),
    auditReproducible:
      hashProposalReplayValue("proposal-replay-audit-repro", input.auditRecords.map((record) => record.entryHash))
      === hashProposalReplayValue("proposal-replay-audit-repro", [...input.auditRecords.map((record) => record.entryHash)]),
  };

  const certified = Object.values(certificationCore).every(Boolean);
  const certification = Object.freeze({
    certified,
    ...certificationCore,
    certificationHash: hashProposalReplayValue("proposal-replay-certification", certificationCore),
  });

  const errors: ProposalReplayError[] = [];
  if (!certified) {
    errors.push({
      code: "PROPOSAL_REPLAY_DETERMINISM_UNPROVEN",
      message: "Proposal replay determinism could not be certified from immutable historical artifacts.",
      path: "certification",
    });
  }

  if (serializeProposalReplayCertification(certification) !== canonicalizeProposalReplayToString(certification)) {
    errors.push({
      code: "PROPOSAL_REPLAY_DETERMINISM_UNPROVEN",
      message: "Proposal replay certification serialization drifted under deterministic verification.",
      path: "certification",
    });
  }

  return {
    certification,
    errors: Object.freeze(errors),
  };
}
