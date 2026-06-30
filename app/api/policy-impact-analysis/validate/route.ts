import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePolicyImpactUser, validatePolicyImpactRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyImpactUser();
    return apiSuccess(await validatePolicyImpactRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate policy impact.");
  }
}
