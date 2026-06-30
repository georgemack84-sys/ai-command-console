import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayPolicyCorrelationRequest, requirePolicyCorrelationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyCorrelationUser();
    return apiSuccess(await replayPolicyCorrelationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay PolicyCorrelation contract.");
  }
}
