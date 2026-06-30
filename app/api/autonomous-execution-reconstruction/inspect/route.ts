import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectExecutionReconstructionRequest, requireExecutionReconstructionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireExecutionReconstructionUser();
    return apiSuccess(await inspectExecutionReconstructionRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect execution reconstruction.");
  }
}

export async function POST(request: Request) {
  try {
    await requireExecutionReconstructionUser();
    return apiSuccess(await inspectExecutionReconstructionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect execution reconstruction.");
  }
}
