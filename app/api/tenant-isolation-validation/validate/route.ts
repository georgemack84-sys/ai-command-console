import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTenantIsolationValidationUser, validateRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireTenantIsolationValidationUser(); return apiSuccess(await validateRequest(request)); } catch (error) { return apiError(error, "Unable to validate tenant isolation."); } }
