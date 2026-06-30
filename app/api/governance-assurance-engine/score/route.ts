import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceComplianceScoreRequest, requireGovernanceAssuranceEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceAssuranceEngineUser();
    return apiSuccess(await governanceComplianceScoreRequest(request));
  } catch (error) {
    return apiError(error, "Unable to create Governance Compliance Score.");
  }
}
