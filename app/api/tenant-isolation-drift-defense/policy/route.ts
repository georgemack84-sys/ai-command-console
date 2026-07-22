import { apiError, apiSuccess } from "@/src/server/api/response";
import { policyRequest, requireTenantIsolationDriftUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireTenantIsolationDriftUser();
    return apiSuccess(await policyRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve policy isolation report.");
  }
}
