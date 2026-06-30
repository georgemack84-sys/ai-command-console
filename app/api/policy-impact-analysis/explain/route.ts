import { apiError, apiSuccess } from "@/src/server/api/response";
import { explainPolicyImpactRequest, requirePolicyImpactUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyImpactUser();
    return apiSuccess(await explainPolicyImpactRequest(request));
  } catch (error) {
    return apiError(error, "Unable to explain policy impact.");
  }
}
