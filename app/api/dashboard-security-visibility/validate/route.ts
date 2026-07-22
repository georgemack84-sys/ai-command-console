import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDashboardSecurityUser, validateRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireDashboardSecurityUser(); return apiSuccess(await validateRequest(request)); } catch (error) { return apiError(error, "Unable to validate dashboard security visibility."); } }
