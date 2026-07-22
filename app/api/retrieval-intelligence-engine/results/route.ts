import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRetrievalIntelligenceUser, resultsRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRetrievalIntelligenceUser(); return apiSuccess(await resultsRequest()); } catch (error) { return apiError(error, "Unable to retrieve retrieval intelligence results."); } }
export async function POST(request: Request) { try { await requireRetrievalIntelligenceUser(); return apiSuccess(await resultsRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve retrieval intelligence results."); } }
