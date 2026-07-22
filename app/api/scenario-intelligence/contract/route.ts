import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireScenarioIntelligenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireScenarioIntelligenceUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect scenario intelligence contract."); } }
