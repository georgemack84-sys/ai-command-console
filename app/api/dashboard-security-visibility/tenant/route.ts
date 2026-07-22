import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDashboardSecurityUser, sectionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireDashboardSecurityUser(); return apiSuccess(await sectionRequest(request, "tenant_isolation")); } catch (error) { return apiError(error, "Unable to retrieve tenant isolation security."); } }
