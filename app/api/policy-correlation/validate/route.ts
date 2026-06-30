import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePolicyCorrelationUser, validatePolicyCorrelationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyCorrelationUser();
    return apiSuccess(await validatePolicyCorrelationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate PolicyCorrelation contract.");
  }
}
