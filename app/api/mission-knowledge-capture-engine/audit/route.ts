import { auditRequest, requireMissionKnowledgeCaptureUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireMissionKnowledgeCaptureUser(); return apiSuccess(await auditRequest(request)); }
  catch (error) { return apiError(error, "Unable to list mission knowledge audit records."); }
}
