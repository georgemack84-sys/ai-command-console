import { apiError, apiSuccess } from "@/src/server/api/response";
import { leakageRequest, requireTenantIsolationValidatorUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    await requireTenantIsolationValidatorUser();
    return apiSuccess(await leakageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve tenant leakage.");
  }
}
