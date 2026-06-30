import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceAssuranceEvidenceRequest, requireGovernanceAssuranceEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceAssuranceEngineUser();
    return apiSuccess(await governanceAssuranceEvidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to create Governance Assurance evidence.");
  }
}
