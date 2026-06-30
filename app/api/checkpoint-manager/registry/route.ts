import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryCheckpointRequest, requireCheckpointManagerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireCheckpointManagerUser();
    return apiSuccess(await registryCheckpointRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve checkpoint registry.");
  }
}
