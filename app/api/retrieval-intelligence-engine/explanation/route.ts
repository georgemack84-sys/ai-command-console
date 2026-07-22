import { apiError, apiSuccess } from "@/src/server/api/response";
import { explanationRequest, requireRetrievalIntelligenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRetrievalIntelligenceUser(); return apiSuccess(await explanationRequest()); } catch (error) { return apiError(error, "Unable to retrieve retrieval explanation."); } }
export async function POST(request: Request) { try { await requireRetrievalIntelligenceUser(); return apiSuccess(await explanationRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve retrieval explanation."); } }
