export async function previewSamVerification({
  executionId,
}: {
  executionId: string;
}) {
  return {
    dryRun: true as const,
    executed: false as const,
    wouldExecute: false,
    actionType: "inspect_state" as const,
    summary: `Verification adapter placeholder for ${executionId}.`,
    expectedEffects: [],
    blockedEffects: ["verification execution deferred to later 3.6 phases"],
  };
}
