import { apiError, apiSuccess } from "@/src/server/api/response";
import { contaminationRequest, requireTenantIsolationDriftUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireTenantIsolationDriftUser();
    return apiSuccess(await contaminationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve cross-tenant contamination assessment.");
  }
}
