import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectVisibilityCertificationRequest, requireVisibilityCertificationGateUser, validateVisibilityCertificationRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireVisibilityCertificationGateUser(); return apiSuccess(await inspectVisibilityCertificationRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Visibility Certification Gate."); }
}
export async function POST(request: Request) {
  try { await requireVisibilityCertificationGateUser(); return apiSuccess({ validation: await validateVisibilityCertificationRequest(request), observability: await inspectVisibilityCertificationRequest(request) }); }
  catch (error) { return apiError(error, "Unable to inspect Visibility Certification Gate."); }
}
