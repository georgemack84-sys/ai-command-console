import { apiError, apiSuccess } from "@/src/server/api/response";
import { reconstructExecutionRequest, requireExecutionReconstructionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionReconstructionUser();
    return apiSuccess(await reconstructExecutionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to reconstruct autonomous execution.");
  }
}
