import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRuntimeAssuranceEngineUser, runtimeAssuranceDashboardRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRuntimeAssuranceEngineUser();
    return apiSuccess(await runtimeAssuranceDashboardRequest());
  } catch (error) {
    return apiError(error, "Unable to load Runtime Assurance dashboard.");
  }
}

export async function POST(request: Request) {
  try {
    await requireRuntimeAssuranceEngineUser();
    return apiSuccess(await runtimeAssuranceDashboardRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Runtime Assurance dashboard.");
  }
}
