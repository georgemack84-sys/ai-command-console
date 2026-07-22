import { apiError, apiSuccess } from "@/src/server/api/response";
import { registerAgentRequest, requireMultiAgentCoordinationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMultiAgentCoordinationUser();
    return apiSuccess(await registerAgentRequest(request));
  } catch (error) {
    return apiError(error, "Unable to register multi-agent coordination agent.");
  }
}
