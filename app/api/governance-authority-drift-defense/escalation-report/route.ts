import { apiError, apiSuccess } from "@/src/server/api/response";
import { escalationReportRequest, requireGovernanceAuthorityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceAuthorityUser();
    return apiSuccess(await escalationReportRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve escalation integrity report.");
  }
}
