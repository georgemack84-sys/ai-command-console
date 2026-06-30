import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireFinalAutonomyCertificationUser, testsRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireFinalAutonomyCertificationUser(); return apiSuccess(await testsRequest(request)); }
  catch (error) { return apiError(error, "Unable to load Final Autonomy Certification tests."); }
}
