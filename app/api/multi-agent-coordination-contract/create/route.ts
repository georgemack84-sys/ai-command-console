import { apiError, apiSuccess } from "@/src/server/api/response";
import { createRequest, requireMultiAgentCoordinationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMultiAgentCoordinationUser();
    return apiSuccess(await createRequest(request));
  } catch (error) {
    return apiError(error, "Unable to create multi-agent coordination contract.");
  }
}
