import type { AutonomyLevel } from "@/types/deterministic-snapshot-engine";
import type { AutonomyBoundary, ConstitutionalGovernanceInput } from "@/types/constitutional-governance";

const CEILINGS: Record<AutonomyLevel, AutonomyLevel> = {
  A0: "A0",
  A1: "A1",
  A2: "A2",
  A3: "A2",
  A4: "A2",
  A5: "A2",
};

export function evaluateAutonomyBoundary(input: ConstitutionalGovernanceInput): AutonomyBoundary {
  const currentLevel = input.consoleView.autonomy.autonomyLevel;
  const ceilingLevel = CEILINGS[currentLevel];
  const deniedOperations = Object.freeze([
    "self-authorize",
    "execute",
    "recursive-authority-escalation",
    "hidden-execution",
  ]);

  return Object.freeze({
    decision: currentLevel === ceilingLevel ? "ALLOW" : "DENY",
    visibilityOnly: true,
    currentLevel,
    ceilingLevel,
    authorityClasses: Object.freeze(["observe", "recommend", "prepare-boundary"]),
    escalationTriggers: Object.freeze([
      "governance-metadata-missing",
      "replay-lineage-disputed",
      "snapshot-lineage-disputed",
      "approval-lineage-missing",
    ]),
    approvalRequirements: Object.freeze([input.treaty.manifest.approvalChainHash]),
    governanceRequirements: Object.freeze([
      input.treaty.manifest.governanceSnapshotHash,
      "NO_AUTONOMOUS_DECISION_MAY_BYPASS_4_4H_GOVERNANCE",
    ]),
    deniedOperations,
  });
}
