import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireQuerySecurityTenantIsolationUser, validateQuerySecurityTenantIsolationRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireQuerySecurityTenantIsolationUser(); return apiSuccess(await validateQuerySecurityTenantIsolationRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate query security."); }
}
