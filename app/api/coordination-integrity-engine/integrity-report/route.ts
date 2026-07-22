import { apiError, apiSuccess } from "@/src/server/api/response";
import { integrityReportRequest, requireCoordinationIntegrityUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireCoordinationIntegrityUser(); return apiSuccess(await integrityReportRequest(request)); }
  catch (error) { return apiError(error, "Unable to generate coordination integrity report."); }
}
