import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePolicyLineageUser, timelinePolicyLineageRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyLineageUser();
    return apiSuccess(await timelinePolicyLineageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build policy timeline.");
  }
}
