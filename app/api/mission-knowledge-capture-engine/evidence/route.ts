import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireMissionKnowledgeCaptureUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireMissionKnowledgeCaptureUser(); return apiSuccess(await evidenceRequest(request)); }
  catch (error) { return apiError(error, "Unable to list mission knowledge evidence."); }
}
