import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildMissionControlGraphVisualizationObservabilitySurface,
  getMissionControlGraphVisualizationContract,
  runMissionControlGraphVisualizationEngine,
  validateMissionControlGraphVisualizationEngine,
} from "@/services/mission-control-graph-visualization-engine";
import type { MissionControlGraphType, MissionControlGraphVisualizationInput, MissionControlGraphVisualizationReport } from "@/types/mission-control-graph-visualization-engine";

export async function requireMissionControlGraphVisualizationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): MissionControlGraphVisualizationInput {
  return body as MissionControlGraphVisualizationInput;
}

function reportFromBody(body: Record<string, unknown>): MissionControlGraphVisualizationReport {
  return (body.report as MissionControlGraphVisualizationReport | undefined) ?? runMissionControlGraphVisualizationEngine(inputFromBody(body));
}

function graphRequestFor(report: MissionControlGraphVisualizationReport, graph_type: MissionControlGraphType) {
  return report.graphs.find((graph) => graph.graph_type === graph_type) ?? null;
}

export function getMissionControlGraphVisualizationContractResponse() { return getMissionControlGraphVisualizationContract(); }
export async function graphEngineRequest(request: Request) { return runMissionControlGraphVisualizationEngine(inputFromBody(await readBody(request))); }
export async function validateGraphVisualizationRequest(request: Request) { return validateMissionControlGraphVisualizationEngine(reportFromBody(await readBody(request))); }
export async function graphsRequest(request: Request) { return reportFromBody(await readBody(request)).graphs; }
export async function planningGraphRequest(request: Request) { return graphRequestFor(reportFromBody(await readBody(request)), "PLANNING_GRAPH"); }
export async function delegationGraphRequest(request: Request) { return graphRequestFor(reportFromBody(await readBody(request)), "DELEGATION_GRAPH"); }
export async function executionGraphRequest(request: Request) { return graphRequestFor(reportFromBody(await readBody(request)), "EXECUTION_GRAPH"); }
export async function lineageGraphRequest(request: Request) { return graphRequestFor(reportFromBody(await readBody(request)), "LINEAGE_GRAPH"); }
export async function governanceGraphRequest(request: Request) { return graphRequestFor(reportFromBody(await readBody(request)), "GOVERNANCE_GRAPH"); }
export async function layoutRequest(request: Request) { return reportFromBody(await readBody(request)).layout_record; }
export async function replayRequest(request: Request) { return reportFromBody(await readBody(request)).replay_record; }
export async function inspectGraphVisualizationRequest(request?: Request) {
  if (!request) return buildMissionControlGraphVisualizationObservabilitySurface();
  return buildMissionControlGraphVisualizationObservabilitySurface(reportFromBody(await readBody(request)));
}
