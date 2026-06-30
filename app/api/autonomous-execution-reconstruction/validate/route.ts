import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireExecutionReconstructionUser, validateExecutionReconstructionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionReconstructionUser();
    return apiSuccess(await validateExecutionReconstructionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate execution reconstruction.");
  }
}
