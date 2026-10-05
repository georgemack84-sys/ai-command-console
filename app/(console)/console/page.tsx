import nextDynamic from "next/dynamic";
import { requireSessionUser } from "@/src/lib/auth";
import { buildMissionConsoleComposition } from "@/services/mission-intelligence-console";
import { buildConstitutionalGovernanceSeedFromComposition, buildConstitutionalGovernanceView } from "@/services/constitutional-governance-layer";

const MissionIntelligenceConsole = nextDynamic(() => import("@/components/mission/console/MissionIntelligenceConsole").then((module) => module.MissionIntelligenceConsole));

export const dynamic = "force-dynamic";

type ConsolePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  if (Array.isArray(value)) {
    return String(value[0] || "").trim();
  }
  return String(value || "").trim();
}

export default async function ConsolePage({ searchParams }: ConsolePageProps) {
  await requireSessionUser();
  const resolvedSearchParams = (await searchParams) || {};
  const executionId =
    readSearchParam(resolvedSearchParams, "executionId")
    || readSearchParam(resolvedSearchParams, "planId")
    || "mission-execution-001";

  const composition = buildMissionConsoleComposition({
    executionId,
    missionId: "mission-001",
  });
  const governanceView = buildConstitutionalGovernanceView(buildConstitutionalGovernanceSeedFromComposition(composition));

  return <MissionIntelligenceConsole view={composition.missionView} governanceView={governanceView} />;
}
