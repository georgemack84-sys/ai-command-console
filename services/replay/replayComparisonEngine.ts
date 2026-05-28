import { detectReplayDivergence } from "./divergence/replayDivergenceDetector";

export function compareReplayToHistoricalTruth({
  replayResult,
  historicalState,
  expectedGovernanceApproved = null,
}: {
  replayResult: {
    reconstructedStates: string[];
    replaySequence: string[];
    deterministic: boolean;
  };
  historicalState: Record<string, unknown> | null;
  expectedGovernanceApproved?: boolean | null;
}) {
  const replayState = {
    runtimeState: replayResult.reconstructedStates.at(-1) || "",
    outputHash: (historicalState?.outputHash as string | undefined) || "",
  };
  return detectReplayDivergence({
    replayState,
    historicalState,
    replaySequence: replayResult.replaySequence,
    historicalSequence: Array.isArray(historicalState?.historicalSequence) ? historicalState?.historicalSequence as string[] : replayResult.replaySequence,
    governanceApproved: expectedGovernanceApproved == null ? null : expectedGovernanceApproved,
    expectedGovernanceApproved: expectedGovernanceApproved == null ? null : expectedGovernanceApproved,
  });
}
