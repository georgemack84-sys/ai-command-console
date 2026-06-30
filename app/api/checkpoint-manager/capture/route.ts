import { apiError, apiSuccess } from "@/src/server/api/response";
import { captureCheckpointRequest, requireCheckpointManagerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireCheckpointManagerUser();
    return apiSuccess(await captureCheckpointRequest(request));
  } catch (error) {
    return apiError(error, "Unable to capture checkpoint state.");
  }
}
