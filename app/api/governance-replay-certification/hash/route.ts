import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashGovernanceReplayCertificationRequest, requireGovernanceReplayCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceReplayCertificationUser();
    return apiSuccess(await hashGovernanceReplayCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash governance replay certification report.");
  }
}
