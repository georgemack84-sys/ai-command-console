import { apiError, apiSuccess } from "@/src/server/api/response";
import { defendRequest, requireTenantIsolationDriftUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireTenantIsolationDriftUser();
    return apiSuccess(await defendRequest(request));
  } catch (error) {
    return apiError(error, "Unable to defend tenant isolation drift.");
  }
}
