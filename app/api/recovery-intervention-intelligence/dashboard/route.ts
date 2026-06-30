import { apiError, apiSuccess } from "@/src/server/api/response";
import { recoveryDashboardRequest, requireRecoveryInterventionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecoveryInterventionUser();
    return apiSuccess(await recoveryDashboardRequest());
  } catch (error) {
    return apiError(error, "Unable to load Recovery & Intervention dashboard.");
  }
}

export async function POST(request: Request) {
  try {
    await requireRecoveryInterventionUser();
    return apiSuccess(await recoveryDashboardRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Recovery & Intervention dashboard.");
  }
}
