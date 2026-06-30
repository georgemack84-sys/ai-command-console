import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireFinalAutonomyCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireFinalAutonomyCertificationUser(); return apiSuccess(await readinessRequest(request)); }
  catch (error) { return apiError(error, "Unable to load Final Autonomy Certification readiness."); }
}
