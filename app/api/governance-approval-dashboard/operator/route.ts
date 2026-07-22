import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceApprovalDashboardUser, sectionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceApprovalDashboardUser();
    return apiSuccess(await sectionRequest(request, "operator_workspace"));
  } catch (error) {
    return apiError(error, "Unable to retrieve operator approval workspace.");
  }
}
