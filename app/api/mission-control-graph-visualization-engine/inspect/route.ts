import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGraphVisualizationRequest, requireMissionControlGraphVisualizationUser, validateGraphVisualizationRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireMissionControlGraphVisualizationUser(); return apiSuccess(await inspectGraphVisualizationRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Mission Control Graph Visualization Engine."); }
}
export async function POST(request: Request) {
  try { await requireMissionControlGraphVisualizationUser(); return apiSuccess({ validation: await validateGraphVisualizationRequest(request), observability: await inspectGraphVisualizationRequest(request) }); }
  catch (error) { return apiError(error, "Unable to inspect Mission Control Graph Visualization Engine."); }
}
