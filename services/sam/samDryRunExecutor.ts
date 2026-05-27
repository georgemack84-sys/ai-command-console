import { previewSamExecution } from "./adapters";
import type { SamProposal } from "./samTypes";
import { onSamChaosDryRunStart } from "./chaos/samFailureInjection";
import { measureSamAsyncDuration } from "./performance/samLatencyTracker";
import { recordSamThroughputEvent } from "./performance/samThroughputTracker";
import { beginSamDryRun, finishSamDryRun } from "./scaling/samQueueGovernor";

export async function generateSamDryRun({
  proposal,
}: {
  proposal: SamProposal;
}) {
  const admission = beginSamDryRun();
  if (!admission.allowed) {
    throw new Error(admission.reason);
  }

  try {
    return await measureSamAsyncDuration("sam.dryrun.duration", async () => {
      onSamChaosDryRunStart();
      const result = await previewSamExecution({ proposal });
      recordSamThroughputEvent("dryrun_generated");
      return result;
    });
  } finally {
    finishSamDryRun();
  }
}
