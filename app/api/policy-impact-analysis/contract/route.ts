import { apiError, apiSuccess } from "@/src/server/api/response";
import { getPolicyImpactContract, requirePolicyImpactUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePolicyImpactUser();
    return apiSuccess(getPolicyImpactContract());
  } catch (error) {
    return apiError(error, "Unable to load PolicyImpactAnalysis contract.");
  }
}
