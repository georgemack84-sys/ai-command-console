import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceReplayCertificationUser, validateGovernanceReplayCertificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceReplayCertificationUser();
    return apiSuccess(await validateGovernanceReplayCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate governance replay certification.");
  }
}
