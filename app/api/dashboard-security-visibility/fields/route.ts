import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDashboardSecurityUser, sectionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireDashboardSecurityUser(); return apiSuccess(await sectionRequest(request, "field_access")); } catch (error) { return apiError(error, "Unable to retrieve field access controls."); } }
