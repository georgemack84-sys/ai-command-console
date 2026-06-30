import { apiError, apiSuccess } from "@/src/server/api/response";
import { governancePolicyDecisionRequest, requireGovernancePolicyUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernancePolicyUser();
    return apiSuccess(await governancePolicyDecisionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to produce governance policy decision.");
  }
}
