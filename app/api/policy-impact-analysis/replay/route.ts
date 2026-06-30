import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayPolicyImpactRequest, requirePolicyImpactUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyImpactUser();
    return apiSuccess(await replayPolicyImpactRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay policy impact.");
  }
}
