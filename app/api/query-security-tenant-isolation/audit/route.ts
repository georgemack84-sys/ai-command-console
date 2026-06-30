import { apiError, apiSuccess } from "@/src/server/api/response";
import { auditQuerySecurityTenantIsolationRequest, requireQuerySecurityTenantIsolationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireQuerySecurityTenantIsolationUser(); return apiSuccess(await auditQuerySecurityTenantIsolationRequest(request)); }
  catch (error) { return apiError(error, "Unable to load query security audit."); }
}
