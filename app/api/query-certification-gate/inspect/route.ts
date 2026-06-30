import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectQueryCertificationRequest, requireQueryCertificationGateUser, validateQueryCertificationRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireQueryCertificationGateUser(); return apiSuccess(await inspectQueryCertificationRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Query Certification Gate."); }
}
export async function POST(request: Request) {
  try { await requireQueryCertificationGateUser(); return apiSuccess({ validation: await validateQueryCertificationRequest(request), observability: await inspectQueryCertificationRequest(request) }); }
  catch (error) { return apiError(error, "Unable to inspect Query Certification Gate."); }
}
