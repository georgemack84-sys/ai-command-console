import { apiError, apiSuccess } from "@/src/server/api/response";
import { analyzePolicyImpactRequest, requirePolicyImpactUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyImpactUser();
    return apiSuccess(await analyzePolicyImpactRequest(request));
  } catch (error) {
    return apiError(error, "Unable to analyze policy impact.");
  }
}
