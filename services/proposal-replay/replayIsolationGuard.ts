import type { ProposalReplayInput, ProposalReplayError } from "./replayTypes";

export function validateReplayIsolation(
  input: ProposalReplayInput,
): readonly ProposalReplayError[] {
  const haystack = JSON.stringify({
    transitionReason: input.proposalStateEngineInput.transition.reason,
    metadata: input.metadata ?? {},
  }).toLowerCase();

  const errors: ProposalReplayError[] = [];
  const checks: Array<[string, ProposalReplayError["code"], string]> = [
    ["execute", "PROPOSAL_REPLAY_EXECUTION_SEMANTIC", "Proposal replay detected hidden execution semantics."],
    ["orchestr", "PROPOSAL_REPLAY_ORCHESTRATION_SEMANTIC", "Proposal replay detected hidden orchestration semantics."],
    ["schedul", "PROPOSAL_REPLAY_SCHEDULER_SEMANTIC", "Proposal replay detected hidden scheduler semantics."],
    ["runtime mutation", "PROPOSAL_REPLAY_RUNTIME_MUTATION", "Proposal replay detected runtime mutation semantics."],
    ["worker", "PROPOSAL_REPLAY_ORCHESTRATION_SEMANTIC", "Proposal replay detected worker/runtime coordination semantics."],
    ["queue", "PROPOSAL_REPLAY_ORCHESTRATION_SEMANTIC", "Proposal replay detected queue/runtime coordination semantics."],
  ];

  for (const [pattern, code, message] of checks) {
    if (haystack.includes(pattern)) {
      errors.push({ code, message, path: "metadata" });
    }
  }

  return Object.freeze(errors);
}
