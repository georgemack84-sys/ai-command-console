import { apiError, apiSuccess } from "@/src/server/api/response";
import { getMissionControlGraphVisualizationContractResponse, requireMissionControlGraphVisualizationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireMissionControlGraphVisualizationUser(); return apiSuccess(getMissionControlGraphVisualizationContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Mission Control Graph Visualization contract."); }
}
