import { apiError, apiSuccess } from "@/src/server/api/response";
import { authorityReportRequest, requireGovernanceAuthorityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceAuthorityUser();
    return apiSuccess(await authorityReportRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve authority drift report.");
  }
}
