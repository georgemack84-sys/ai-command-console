import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceIntegrityCertificationUser, runGovernanceIntegrityCertificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceIntegrityCertificationUser();
    return apiSuccess(await runGovernanceIntegrityCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to run governance integrity certification.");
  }
}
