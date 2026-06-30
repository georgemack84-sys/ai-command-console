import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationRequest, requireFinalAutonomyCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireFinalAutonomyCertificationUser(); return apiSuccess(await certificationRequest(request)); }
  catch (error) { return apiError(error, "Unable to run Final Autonomy Certification Gate."); }
}
