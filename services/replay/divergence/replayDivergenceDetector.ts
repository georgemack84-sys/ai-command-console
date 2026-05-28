import type { ReplayDivergence } from "../../contracts/replay/replayTypes";
import { buildDivergenceEvidence } from "./divergenceEvidence";
import { requiresDivergenceEscalation } from "./divergenceEscalation";
import { severityForDivergence } from "./divergenceSeverity";

function pushDivergence(collection: ReplayDivergence[], category: string, replayState: string, historicalState: string, deterministic = true) {
  const severity = severityForDivergence(category);
  collection.push({
    category,
    severity,
    deterministic,
    replayState,
    historicalState,
    evidence: buildDivergenceEvidence(category, replayState, historicalState),
    requiresEscalation: requiresDivergenceEscalation(category, severity),
  });
}

export function detectReplayDivergence({
  replayState,
  historicalState,
  replaySequence = [],
  historicalSequence = [],
  governanceApproved,
  expectedGovernanceApproved,
}: {
  replayState: Record<string, unknown> | null;
  historicalState: Record<string, unknown> | null;
  replaySequence?: string[];
  historicalSequence?: string[];
  governanceApproved?: boolean | null;
  expectedGovernanceApproved?: boolean | null;
}): ReplayDivergence[] {
  const divergences: ReplayDivergence[] = [];

  const replayRuntimeState = String(replayState?.runtimeState || replayState?.status || "");
  const historicalRuntimeState = String(historicalState?.runtimeState || historicalState?.status || "");
  if (replayRuntimeState !== historicalRuntimeState) {
    pushDivergence(divergences, "STATE_DIVERGENCE", replayRuntimeState, historicalRuntimeState);
  }

  const replayOutputHash = String(replayState?.outputHash || "");
  const historicalOutputHash = String(historicalState?.outputHash || "");
  if (replayOutputHash || historicalOutputHash) {
    if (replayOutputHash !== historicalOutputHash) {
      pushDivergence(divergences, "OUTPUT_DIVERGENCE", replayOutputHash, historicalOutputHash);
    }
  }

  if (JSON.stringify(replaySequence) !== JSON.stringify(historicalSequence)) {
    pushDivergence(divergences, "TIMELINE_DIVERGENCE", replaySequence.join("->"), historicalSequence.join("->"));
  }

  if (typeof governanceApproved === "boolean" && typeof expectedGovernanceApproved === "boolean" && governanceApproved !== expectedGovernanceApproved) {
    pushDivergence(divergences, "GOVERNANCE_DIVERGENCE", String(governanceApproved), String(expectedGovernanceApproved));
  }

  return divergences;
}
