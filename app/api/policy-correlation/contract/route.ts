import { apiError, apiSuccess } from "@/src/server/api/response";
import { getPolicyCorrelationContract, requirePolicyCorrelationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePolicyCorrelationUser();
    return apiSuccess(getPolicyCorrelationContract());
  } catch (error) {
    return apiError(error, "Unable to load PolicyCorrelation contract.");
  }
}
