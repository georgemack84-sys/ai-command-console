import { apiError, apiSuccess } from "@/src/server/api/response";
import { getQuerySecurityTenantIsolationContractResponse, requireQuerySecurityTenantIsolationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireQuerySecurityTenantIsolationUser(); return apiSuccess(getQuerySecurityTenantIsolationContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Query Security & Tenant Isolation contract."); }
}
