import type { SamProposal } from "../samTypes";

export async function previewSamExecution({
  proposal,
}: {
  proposal: SamProposal;
}) {
  const effectMap: Record<string, string[]> = {
    recover_execution: ["would evaluate governed recovery path", "would require approved handoff in later phases"],
    pause_execution: ["would request execution pause through governed runtime control"],
    resume_execution: ["would request execution resume through governed runtime control"],
    cancel_execution: ["would request execution cancellation through governed runtime control"],
    export_evidence: ["would export current evidence bundle"],
    add_operator_note: ["would append operator note through safe audit surface"],
    inspect_state: ["would inspect current recovery state"],
    unknown: [],
  };

  return {
    dryRun: true as const,
    executed: false as const,
    wouldExecute: proposal.actionType !== "unknown",
    actionType: proposal.actionType,
    summary: `Dry-run preview for ${proposal.actionType}.`,
    expectedEffects: effectMap[proposal.actionType] || [],
    blockedEffects: ["real execution blocked in 3.6A"],
  };
}
