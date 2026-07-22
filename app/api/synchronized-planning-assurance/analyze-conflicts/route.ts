import { apiError, apiSuccess } from "@/src/server/api/response";
import { analyzeConflictsRequest, requireSynchronizedPlanningUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireSynchronizedPlanningUser();
    return apiSuccess(await analyzeConflictsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to analyze synchronized planning conflicts.");
  }
}
