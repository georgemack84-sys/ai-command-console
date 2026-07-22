import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireTenantIsolationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireTenantIsolationUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve tenant isolation privacy enforcement contract.");
  }
}
