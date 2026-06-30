import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceReplayCertificationUser, testsGovernanceReplayCertificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceReplayCertificationUser();
    return apiSuccess(await testsGovernanceReplayCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance replay certification tests.");
  }
}
