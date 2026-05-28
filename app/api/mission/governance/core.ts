import { buildConstitutionalGovernanceSeed, buildConstitutionalGovernanceView } from "@/services/constitutional-governance-layer";

export function buildMissionGovernanceApiModel(executionId: string) {
  return buildConstitutionalGovernanceView(buildConstitutionalGovernanceSeed({ executionId }));
}

export function readExecutionId(request: Request) {
  const url = new URL(request.url);
  return String(url.searchParams.get("executionId") || url.searchParams.get("planId") || "mission-execution-001").trim();
}
