import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceAuthorityValidationRequest, requireGovernanceAssuranceEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceAssuranceEngineUser();
    return apiSuccess(await governanceAuthorityValidationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate Governance Assurance authority.");
  }
}
