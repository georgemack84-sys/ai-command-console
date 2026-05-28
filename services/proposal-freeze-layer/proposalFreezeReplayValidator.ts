import { detectProposalReplayDrift } from "./replayDriftMonitor";
import type { ProposalFreezeInput } from "./types/proposalFreezeTypes";

export function validateProposalFreezeReplay(input: ProposalFreezeInput) {
  return detectProposalReplayDrift(input);
}
