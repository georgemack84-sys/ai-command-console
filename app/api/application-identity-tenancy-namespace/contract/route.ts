import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireApplicationIdentityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationIdentityUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect application identity tenancy namespace contract."); } }
