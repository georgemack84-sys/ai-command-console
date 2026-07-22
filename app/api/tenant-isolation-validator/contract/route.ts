import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireTenantIsolationValidatorUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await requireTenantIsolationValidatorUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve tenant isolation validator contract.");
  }
}
