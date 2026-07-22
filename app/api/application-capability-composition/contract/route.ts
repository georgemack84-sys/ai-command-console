import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireApplicationCapabilityCompositionUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationCapabilityCompositionUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect application capability composition contract."); } }
