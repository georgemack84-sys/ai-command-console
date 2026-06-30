import { apiError, apiSuccess } from "@/src/server/api/response";
import { completionRequest, requireControlledAutonomyCompletionUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireControlledAutonomyCompletionUser(); return apiSuccess(await completionRequest(request)); }
  catch (error) { return apiError(error, "Unable to run Controlled Autonomy Completion Gate."); }
}
