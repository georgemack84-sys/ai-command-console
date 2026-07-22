import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, generateRequest, requireTemplateHeuristicGenerationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireTemplateHeuristicGenerationUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load template heuristic generation engine."); }
}
export async function POST(request: Request) {
  try { await requireTemplateHeuristicGenerationUser(); return apiSuccess(await generateRequest(request)); }
  catch (error) { return apiError(error, "Unable to generate template heuristic knowledge."); }
}
