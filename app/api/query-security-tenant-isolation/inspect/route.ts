import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectQuerySecurityTenantIsolationRequest, requireQuerySecurityTenantIsolationUser, validateQuerySecurityTenantIsolationRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireQuerySecurityTenantIsolationUser(); return apiSuccess(await inspectQuerySecurityTenantIsolationRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Query Security & Tenant Isolation."); }
}
export async function POST(request: Request) {
  try { await requireQuerySecurityTenantIsolationUser(); return apiSuccess({ validation: await validateQuerySecurityTenantIsolationRequest(request), observability: await inspectQuerySecurityTenantIsolationRequest(request) }); }
  catch (error) { return apiError(error, "Unable to inspect Query Security & Tenant Isolation."); }
}
