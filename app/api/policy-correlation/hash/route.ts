import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashPolicyCorrelationRequest, requirePolicyCorrelationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyCorrelationUser();
    return apiSuccess(await hashPolicyCorrelationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash PolicyCorrelation contract.");
  }
}
