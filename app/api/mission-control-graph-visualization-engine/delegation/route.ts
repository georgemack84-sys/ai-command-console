import { apiError, apiSuccess } from "@/src/server/api/response";
import { delegationGraphRequest, requireMissionControlGraphVisualizationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireMissionControlGraphVisualizationUser(); return apiSuccess(await delegationGraphRequest(request)); }
  catch (error) { return apiError(error, "Unable to load Mission Control delegation graph."); }
}
