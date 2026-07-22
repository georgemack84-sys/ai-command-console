import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireApplicationRegistryCatalogUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationRegistryCatalogUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect application registry catalog contract."); } }
