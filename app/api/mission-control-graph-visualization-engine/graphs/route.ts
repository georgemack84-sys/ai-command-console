import { apiError, apiSuccess } from "@/src/server/api/response";
import { graphsRequest, requireMissionControlGraphVisualizationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireMissionControlGraphVisualizationUser(); return apiSuccess(await graphsRequest(request)); }
  catch (error) { return apiError(error, "Unable to load Mission Control graphs."); }
}
