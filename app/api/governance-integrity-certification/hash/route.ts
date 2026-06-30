import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashGovernanceIntegrityCertificationRequest, requireGovernanceIntegrityCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceIntegrityCertificationUser();
    return apiSuccess(await hashGovernanceIntegrityCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash governance integrity certification.");
  }
}
