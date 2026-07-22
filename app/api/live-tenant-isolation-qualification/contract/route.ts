import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireLiveTenantIsolationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireLiveTenantIsolationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load live tenant isolation contract."); } }
