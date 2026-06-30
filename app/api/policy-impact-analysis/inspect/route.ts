import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectPolicyImpactRequest, requirePolicyImpactUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePolicyImpactUser();
    return apiSuccess(await inspectPolicyImpactRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect policy impact.");
  }
}

export async function POST(request: Request) {
  try {
    await requirePolicyImpactUser();
    return apiSuccess(await inspectPolicyImpactRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect policy impact.");
  }
}
