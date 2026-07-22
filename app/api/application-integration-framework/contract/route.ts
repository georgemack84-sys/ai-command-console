import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireApplicationIntegrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationIntegrationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect application integration framework contract."); } }
