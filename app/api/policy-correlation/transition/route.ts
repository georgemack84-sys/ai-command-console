import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePolicyCorrelationUser, transitionPolicyCorrelationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyCorrelationUser();
    return apiSuccess(await transitionPolicyCorrelationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to transition PolicyCorrelation state.");
  }
}
