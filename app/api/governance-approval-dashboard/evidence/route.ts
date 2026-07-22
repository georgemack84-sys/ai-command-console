import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceApprovalDashboardUser, sectionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceApprovalDashboardUser();
    return apiSuccess(await sectionRequest(request, "evidence_workspace"));
  } catch (error) {
    return apiError(error, "Unable to retrieve review evidence workspace.");
  }
}
