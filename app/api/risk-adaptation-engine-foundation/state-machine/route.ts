import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRiskAdaptationUser, stateMachineRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskAdaptationUser();
    return apiSuccess(await stateMachineRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve risk adaptation state machine.");
  }
}
