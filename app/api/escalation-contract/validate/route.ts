import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireEscalationContractUser, validateEscalationContractRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEscalationContractUser();
    return apiSuccess(await validateEscalationContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate escalation contract.");
  }
}
