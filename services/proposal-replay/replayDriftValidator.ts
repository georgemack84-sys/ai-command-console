import { hashProposalReplayValue } from "./replayHasher";
import type { ProposalReplay, ProposalReplayInput, ProposalReplayError, ReplayDrift } from "./replayTypes";

function buildDrift(input: {
  replayId: string;
  detectedAt: string;
  driftType: ReplayDrift["driftType"];
  severity: ReplayDrift["severity"];
  frozen?: boolean;
}): ReplayDrift {
  const frozen = input.frozen ?? true;
  return Object.freeze({
    driftId: `proposal-replay-drift:${input.replayId}:${hashProposalReplayValue("proposal-replay-drift-id", input).slice(0, 12)}`,
    replayId: input.replayId,
    driftType: input.driftType,
    severity: input.severity,
    detectedAt: input.detectedAt,
    frozen,
  });
}

export function validateProposalReplayDrift(input: {
  replayInput: ProposalReplayInput;
  replay: ProposalReplay;
  errors: readonly ProposalReplayError[];
}): readonly ReplayDrift[] {
  const drifts: ReplayDrift[] = [];

  for (const error of input.errors) {
    switch (error.code) {
      case "PROPOSAL_REPLAY_GOVERNANCE_MISMATCH":
        drifts.push(buildDrift({
          replayId: input.replay.replayId,
          detectedAt: input.replayInput.replayedAt,
          driftType: "governance_mismatch",
          severity: "critical",
        }));
        break;
      case "PROPOSAL_REPLAY_VALIDATOR_MISMATCH":
      case "PROPOSAL_REPLAY_VALIDATOR_VERSION_UNAVAILABLE":
        drifts.push(buildDrift({
          replayId: input.replay.replayId,
          detectedAt: input.replayInput.replayedAt,
          driftType: "validator_mismatch",
          severity: "high",
        }));
        break;
      case "PROPOSAL_REPLAY_DEPENDENCY_MISMATCH":
      case "PROPOSAL_REPLAY_DEPENDENCY_SNAPSHOT_MISSING":
        drifts.push(buildDrift({
          replayId: input.replay.replayId,
          detectedAt: input.replayInput.replayedAt,
          driftType: "dependency_mismatch",
          severity: "high",
        }));
        break;
      case "PROPOSAL_REPLAY_APPROVAL_MISMATCH":
      case "PROPOSAL_REPLAY_APPROVAL_SNAPSHOT_MISSING":
        drifts.push(buildDrift({
          replayId: input.replay.replayId,
          detectedAt: input.replayInput.replayedAt,
          driftType: "approval_mismatch",
          severity: "high",
        }));
        break;
      case "PROPOSAL_REPLAY_AUTHORITY_MISMATCH":
      case "PROPOSAL_REPLAY_AUTHORITY_SNAPSHOT_MISSING":
        drifts.push(buildDrift({
          replayId: input.replay.replayId,
          detectedAt: input.replayInput.replayedAt,
          driftType: "authority_mismatch",
          severity: "critical",
        }));
        break;
      case "PROPOSAL_REPLAY_AUDIT_HASH_MISMATCH":
      case "PROPOSAL_REPLAY_LINEAGE_CORRUPTED":
        drifts.push(buildDrift({
          replayId: input.replay.replayId,
          detectedAt: input.replayInput.replayedAt,
          driftType: "audit_hash_mismatch",
          severity: "critical",
        }));
        break;
      default:
        break;
    }
  }

  return Object.freeze(drifts);
}
