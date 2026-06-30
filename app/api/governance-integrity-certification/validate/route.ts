import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceIntegrityCertificationUser, validateGovernanceIntegrityCertificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceIntegrityCertificationUser();
    return apiSuccess(await validateGovernanceIntegrityCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate governance integrity certification.");
  }
}
