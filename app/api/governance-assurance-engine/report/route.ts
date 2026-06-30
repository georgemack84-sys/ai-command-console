import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceAssuranceReportRequest, requireGovernanceAssuranceEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceAssuranceEngineUser();
    return apiSuccess(await governanceAssuranceReportRequest(request));
  } catch (error) {
    return apiError(error, "Unable to create Governance Assurance report.");
  }
}
