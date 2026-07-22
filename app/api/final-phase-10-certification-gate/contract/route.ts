import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireFinalPhase10User } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireFinalPhase10User(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to retrieve final Phase 10 certification contract."); } }
