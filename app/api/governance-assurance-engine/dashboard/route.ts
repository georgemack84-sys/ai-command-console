import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceAssuranceDashboardRequest, requireGovernanceAssuranceEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceAssuranceEngineUser();
    return apiSuccess(await governanceAssuranceDashboardRequest());
  } catch (error) {
    return apiError(error, "Unable to load Governance Assurance dashboard.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceAssuranceEngineUser();
    return apiSuccess(await governanceAssuranceDashboardRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Governance Assurance dashboard.");
  }
}
