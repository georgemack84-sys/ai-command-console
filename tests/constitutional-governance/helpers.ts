import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildConstitutionalGovernanceSeed,
  buildConstitutionalGovernanceView,
  detectConstitutionalGovernanceViolations,
} from "@/services/constitutional-governance-layer";

export function buildConstitutionalGovernanceFixture(overrides: Partial<{
  executionId: string;
}> = {}) {
  const input = buildConstitutionalGovernanceSeed({
    executionId: overrides.executionId,
  });
  return {
    input,
    view: buildConstitutionalGovernanceView(input),
  };
}

export function loadConstitutionalGovernanceSources() {
  const files = [
    ["services", "constitutional-governance-layer", "index.ts"],
    ["services", "constitutional-governance-layer", "constitutionalGovernanceLayer.ts"],
    ["services", "constitutional-governance-layer", "constitutionalGovernanceSeed.ts"],
    ["services", "constitutional-governance-layer", "constitutionalGovernanceGuards.ts"],
    ["services", "constitutional-governance-layer", "constitutionalGovernanceHasher.ts"],
    ["services", "authority-boundary-registry", "index.ts"],
    ["services", "replay-governance-controller", "index.ts"],
    ["services", "snapshot-access-governor", "index.ts"],
    ["services", "simulation-governance-engine", "index.ts"],
    ["services", "recovery-authority-engine", "index.ts"],
    ["services", "escalation-governance-engine", "index.ts"],
    ["services", "autonomy-boundary-engine", "index.ts"],
    ["components", "mission", "governance", "ConstitutionalGovernanceSection.tsx"],
    ["components", "mission", "governance", "ConstitutionalStatusPanel.tsx"],
    ["components", "mission", "governance", "AuthorityLineagePanel.tsx"],
    ["components", "mission", "governance", "ReplayGovernancePanel.tsx"],
    ["components", "mission", "governance", "SnapshotGovernancePanel.tsx"],
    ["components", "mission", "governance", "SimulationGovernancePanel.tsx"],
    ["components", "mission", "governance", "RecoveryGovernancePanel.tsx"],
    ["components", "mission", "governance", "EscalationGovernancePanel.tsx"],
    ["components", "mission", "governance", "AutonomyBoundariesPanel.tsx"],
    ["components", "mission", "governance", "ConstitutionalViolationsPanel.tsx"],
    ["components", "mission", "governance", "GovernanceAuditTimelinePanel.tsx"],
  ];

  return files.map((segments) => {
    const filePath = path.resolve(...segments);
    return {
      path: filePath,
      content: readFileSync(filePath, "utf8"),
    };
  });
}

export {
  buildConstitutionalGovernanceView,
  detectConstitutionalGovernanceViolations,
};
