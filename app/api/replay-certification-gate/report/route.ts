import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayCertificationReportRequest, requireReplayCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireReplayCertificationUser(); return apiSuccess(await replayCertificationReportRequest(request)); }
  catch (error) { return apiError(error, "Unable to generate replay certification report."); }
}
