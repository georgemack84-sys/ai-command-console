import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceGovernanceIntegrityCertificationRequest, requireGovernanceIntegrityCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceIntegrityCertificationUser();
    return apiSuccess(await evidenceGovernanceIntegrityCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance integrity certification evidence.");
  }
}
