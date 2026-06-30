import { apiError, apiSuccess } from "@/src/server/api/response";
import { recoveryExplainabilityRequest, requireRecoveryInterventionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecoveryInterventionUser();
    return apiSuccess(await recoveryExplainabilityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to explain Recovery & Intervention recommendation.");
  }
}
