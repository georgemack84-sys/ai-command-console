import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireGovernanceApprovalDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceApprovalDashboardUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect governance approval dashboard.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceApprovalDashboardUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect governance approval dashboard.");
  }
}
