import { apiError, apiSuccess } from "@/src/server/api/response";
import { dataRequest, requireTenantIsolationValidatorUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    await requireTenantIsolationValidatorUser();
    return apiSuccess(await dataRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve data isolation.");
  }
}
