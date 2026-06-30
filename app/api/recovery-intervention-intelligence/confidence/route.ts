import { apiError, apiSuccess } from "@/src/server/api/response";
import { recoveryConfidenceRequest, requireRecoveryInterventionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecoveryInterventionUser();
    return apiSuccess(await recoveryConfidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to assess Recovery confidence.");
  }
}
