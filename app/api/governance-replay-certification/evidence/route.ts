import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceGovernanceReplayCertificationRequest, requireGovernanceReplayCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceReplayCertificationUser();
    return apiSuccess(await evidenceGovernanceReplayCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance replay certification evidence.");
  }
}
