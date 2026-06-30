import { apiError, apiSuccess } from "@/src/server/api/response";
import { matrixRequest, requireControlledAutonomyCompletionUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireControlledAutonomyCompletionUser(); return apiSuccess(await matrixRequest(request)); }
  catch (error) { return apiError(error, "Unable to load Controlled Autonomy completion matrix."); }
}
