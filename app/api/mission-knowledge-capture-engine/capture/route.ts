import { apiError, apiSuccess } from "@/src/server/api/response";
import { captureRequest, contractResponse, requireMissionKnowledgeCaptureUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireMissionKnowledgeCaptureUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load mission knowledge capture engine."); }
}
export async function POST(request: Request) {
  try { await requireMissionKnowledgeCaptureUser(); return apiSuccess(await captureRequest(request)); }
  catch (error) { return apiError(error, "Unable to capture mission knowledge."); }
}
