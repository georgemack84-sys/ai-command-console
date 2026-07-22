import { apiError, apiSuccess } from "@/src/server/api/response";
import { agentGraphRequest, requireCoordinationDashboardUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireCoordinationDashboardUser(); return apiSuccess(await agentGraphRequest(request)); }
  catch (error) { return apiError(error, "Unable to load dashboard agent graph."); }
}
