import { apiError, apiSuccess } from "@/src/server/api/response";
import { executionTimelineRequest, requireExecutionReconstructionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionReconstructionUser();
    return apiSuccess(await executionTimelineRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build execution reconstruction timeline.");
  }
}
