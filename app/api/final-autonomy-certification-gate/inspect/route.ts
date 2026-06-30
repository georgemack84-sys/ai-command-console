import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireFinalAutonomyCertificationUser, validateRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireFinalAutonomyCertificationUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Final Autonomy Certification Gate."); }
}
export async function POST(request: Request) {
  try { await requireFinalAutonomyCertificationUser(); return apiSuccess({ validation: await validateRequest(request), observability: await inspectRequest(request) }); }
  catch (error) { return apiError(error, "Unable to inspect Final Autonomy Certification Gate."); }
}
