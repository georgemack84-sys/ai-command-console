import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireContinuousConstitutionalUser, timelineRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireContinuousConstitutionalUser(); return apiSuccess(await timelineRequest(request)); }
  catch (error) { return apiError(error, "Unable to list constitutional compliance timeline."); }
}
