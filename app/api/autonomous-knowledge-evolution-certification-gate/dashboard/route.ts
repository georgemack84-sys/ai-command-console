import { dashboardRequest, requireAutonomousKnowledgeCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomousKnowledgeCertificationUser(); return apiSuccess(await dashboardRequest(request)); }
  catch (error) { return apiError(error, "Unable to build certification dashboard."); }
}
