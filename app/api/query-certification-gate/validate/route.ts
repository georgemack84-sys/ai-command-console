import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireQueryCertificationGateUser, validateQueryCertificationRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireQueryCertificationGateUser(); return apiSuccess(await validateQueryCertificationRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate Query Certification Gate report."); }
}
