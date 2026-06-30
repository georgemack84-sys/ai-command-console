import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceReplayCertificationUser, runGovernanceReplayCertificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceReplayCertificationUser();
    return apiSuccess(await runGovernanceReplayCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to run governance replay certification.");
  }
}
