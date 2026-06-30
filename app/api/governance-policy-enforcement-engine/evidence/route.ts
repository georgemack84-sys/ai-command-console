import { apiError, apiSuccess } from "@/src/server/api/response";
import { governancePolicyEvidenceRequest, requireGovernancePolicyUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernancePolicyUser();
    return apiSuccess(await governancePolicyEvidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance policy evidence.");
  }
}
