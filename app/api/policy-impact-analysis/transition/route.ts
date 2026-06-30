import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePolicyImpactUser, transitionPolicyImpactRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyImpactUser();
    return apiSuccess(await transitionPolicyImpactRequest(request));
  } catch (error) {
    return apiError(error, "Unable to transition policy impact state.");
  }
}
