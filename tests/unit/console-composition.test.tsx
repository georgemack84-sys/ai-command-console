import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import {
  buildMissionConsoleComposition,
  buildMissionConsoleSeedContext,
  buildMissionConsoleView,
} from "@/services/mission-intelligence-console";
import {
  buildConstitutionalGovernanceSeed,
  buildConstitutionalGovernanceSeedFromComposition,
  buildConstitutionalGovernanceView,
  buildMissionConsoleGovernanceContext,
} from "@/services/constitutional-governance-layer";
import { TimelinePanel } from "@/components/mission/console/TimelinePanel";
import { SnapshotPanel } from "@/components/mission/console/SnapshotPanel";
import { AuthorityLineagePanel } from "@/components/mission/governance/AuthorityLineagePanel";
import { GovernanceAuditTimelinePanel } from "@/components/mission/governance/GovernanceAuditTimelinePanel";

const { requireSessionUser } = vi.hoisted(() => ({
  requireSessionUser: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  requireSessionUser,
}));

import ConsolePage from "@/app/console/page";

describe("console shared composition", () => {
  it("preserves mission output equivalence", () => {
    const input = { executionId: "mission-execution-001", missionId: "mission-001" };
    const legacyMissionView = buildMissionConsoleView(buildMissionConsoleSeedContext(input));
    const composition = buildMissionConsoleComposition(input);

    expect(composition.missionView).toEqual(legacyMissionView);
  });

  it("preserves governance output equivalence while narrowing console context", () => {
    const input = { executionId: "mission-execution-001", missionId: "mission-001" };
    const legacyGovernanceSeed = buildConstitutionalGovernanceSeed(input);
    const composition = buildMissionConsoleComposition(input);
    const sharedGovernanceSeed = buildConstitutionalGovernanceSeedFromComposition(composition);

    expect(buildConstitutionalGovernanceView(sharedGovernanceSeed)).toEqual(
      buildConstitutionalGovernanceView(legacyGovernanceSeed),
    );
    expect(sharedGovernanceSeed.consoleView).toEqual(buildMissionConsoleGovernanceContext(composition.missionView));
    expect("timeline" in sharedGovernanceSeed.consoleView).toBe(false);
    expect("snapshots" in sharedGovernanceSeed.consoleView).toBe(false);
  });

  it("preserves lineage fields and does not mutate the shared mission view", () => {
    const composition = buildMissionConsoleComposition({
      executionId: "mission-execution-001",
      missionId: "mission-001",
    });
    const before = JSON.stringify(composition.missionView);
    const governanceSeed = buildConstitutionalGovernanceSeedFromComposition(composition);
    const governanceView = buildConstitutionalGovernanceView(governanceSeed);

    expect(governanceSeed.consoleView).toEqual(buildMissionConsoleGovernanceContext(composition.missionView));
    expect(governanceSeed.treaty.evidence.governanceLineageHash).toBeTruthy();
    expect(governanceSeed.treaty.evidence.replayLineageHash).toBeTruthy();
    expect(governanceView.policy.governanceLineageHash).toBe(governanceSeed.treaty.evidence.governanceLineageHash);
    expect(governanceView.policy.approvalLineageHash).toBe(governanceSeed.treaty.manifest.approvalChainHash);
    expect(JSON.stringify(composition.missionView)).toBe(before);
    expect(Object.isFrozen(composition)).toBe(true);
    expect(Object.isFrozen(composition.missionView)).toBe(true);
  });

  it("keeps narrowed target panel output equivalent", () => {
    const composition = buildMissionConsoleComposition({
      executionId: "mission-execution-001",
      missionId: "mission-001",
    });
    const governanceView = buildConstitutionalGovernanceView(
      buildConstitutionalGovernanceSeedFromComposition(composition),
    );

    expect(renderToStaticMarkup(<TimelinePanel entries={composition.missionView.timeline.data.entries} />)).toContain("Timeline");
    expect(renderToStaticMarkup(<SnapshotPanel snapshots={composition.missionView.snapshots.data.snapshots} />)).toContain("Snapshots");
    expect(renderToStaticMarkup(<AuthorityLineagePanel authorityBoundaries={governanceView.authorityBoundaries} />)).toContain("Lineage hash");
    expect(renderToStaticMarkup(<GovernanceAuditTimelinePanel auditTimeline={governanceView.auditTimeline} />)).toContain("Lineage hashes");
  });

  it("renders mission and governance sections through the console route", async () => {
    requireSessionUser.mockResolvedValue({
      id: "user_1",
    });

    const element = await ConsolePage({
      searchParams: Promise.resolve({
        executionId: "mission-execution-001",
      }),
    });

    const markup = renderToStaticMarkup(element);

    expect(requireSessionUser).toHaveBeenCalled();
    expect(markup).toContain("Mission Intelligence Console");
    expect(markup).toContain("Constitutional Governance");
    expect(markup).toContain("Constitutional Mission Intelligence");
  });
});
