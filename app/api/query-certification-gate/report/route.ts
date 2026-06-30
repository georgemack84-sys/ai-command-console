import { apiError, apiSuccess } from "@/src/server/api/response";
import { queryCertificationReportRequest, requireQueryCertificationGateUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireQueryCertificationGateUser(); return apiSuccess(await queryCertificationReportRequest(request)); }
  catch (error) { return apiError(error, "Unable to load Query Certification Gate report."); }
}
