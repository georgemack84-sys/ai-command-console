import { apiError, apiSuccess } from "@/src/server/api/response";
import { graphEngineRequest, requireMissionControlGraphVisualizationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireMissionControlGraphVisualizationUser(); return apiSuccess(await graphEngineRequest(request)); }
  catch (error) { return apiError(error, "Unable to build Mission Control Graph Visualization Engine."); }
}
