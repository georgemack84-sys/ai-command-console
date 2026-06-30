import { apiError, apiSuccess } from "@/src/server/api/response";
import { authorizeQuerySecurityTenantIsolationRequest, requireQuerySecurityTenantIsolationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireQuerySecurityTenantIsolationUser(); return apiSuccess(await authorizeQuerySecurityTenantIsolationRequest(request)); }
  catch (error) { return apiError(error, "Unable to authorize autonomy query."); }
}
