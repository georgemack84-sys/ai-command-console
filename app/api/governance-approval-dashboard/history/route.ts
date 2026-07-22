import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceApprovalDashboardUser, sectionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceApprovalDashboardUser();
    return apiSuccess(await sectionRequest(request, "decision_history"));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance decision history.");
  }
}
