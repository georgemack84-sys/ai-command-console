import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, inspectRequest, requireProposedResponseDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireProposedResponseDashboardUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect proposed response dashboard.");
  }
}

export async function POST(request: Request) {
  try {
    await requireProposedResponseDashboardUser();
    return apiSuccess(await dashboardRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build proposed response dashboard.");
  }
}
