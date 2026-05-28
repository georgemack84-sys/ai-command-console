import type { ConstitutionalGovernanceInput, ReplayAuthority } from "@/types/constitutional-governance";

export function evaluateReplayGovernance(input: ConstitutionalGovernanceInput): ReplayAuthority {
  const lineageValid = input.replay.status === "RECONSTRUCTED" && input.replay.integrity.valid;
  const evidenceLinks = Object.freeze([
    {
      label: "Replay reconstruction",
      authority: "4.4E.replay-reconstruction-engine" as const,
      hash: input.replay.reconstructionHash,
      ref: input.replay.replayId,
    },
    {
      label: "Treaty replay lineage",
      authority: "4.3O.execution-treaty" as const,
      hash: input.treaty.evidence.replayLineageHash,
      ref: input.treaty.manifest.replayBindingHash,
    },
  ]);

  return Object.freeze({
    decision: lineageValid ? "ALLOW" : "DENY",
    lineageValid,
    allowedOperations: Object.freeze(lineageValid ? ["inspect", "compare", "export-evidence"] : []),
    deniedOperations: Object.freeze(["mutate", "execute", "escalate", ...(lineageValid ? [] : ["inspect-with-disputed-lineage"])]),
    replaySnapshotHash: input.treaty.manifest.replaySnapshotHash,
    replayLineageHash: input.treaty.evidence.replayLineageHash,
    evidenceLinks,
  });
}
