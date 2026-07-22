import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireRetrievalIntelligenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRetrievalIntelligenceUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to retrieve retrieval intelligence contract."); } }
