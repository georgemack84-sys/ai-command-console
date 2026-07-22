import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireMultiAgentCoordinationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireMultiAgentCoordinationUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load multi-agent coordination contract.");
  }
}
