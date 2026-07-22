import { apiError, apiSuccess } from "@/src/server/api/response";
import { establishRequest, requireTenantIsolationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireTenantIsolationUser();
    return apiSuccess(await establishRequest(request));
  } catch (error) {
    return apiError(error, "Unable to establish tenant isolation privacy enforcement.");
  }
}
