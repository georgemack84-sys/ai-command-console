import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireControlledAutonomyCompletionUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireControlledAutonomyCompletionUser(); return apiSuccess(await readinessRequest(request)); }
  catch (error) { return apiError(error, "Unable to load Controlled Autonomy readiness."); }
}
