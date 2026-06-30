import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireVisibilityCertificationGateUser, visibilityCertificationTestsRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireVisibilityCertificationGateUser(); return apiSuccess(await visibilityCertificationTestsRequest(request)); }
  catch (error) { return apiError(error, "Unable to load Visibility Certification tests."); }
}
