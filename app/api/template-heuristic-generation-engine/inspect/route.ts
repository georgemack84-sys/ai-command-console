import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireTemplateHeuristicGenerationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireTemplateHeuristicGenerationUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect template heuristic generation."); }
}
export async function POST(request: Request) {
  try { await requireTemplateHeuristicGenerationUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect template heuristic generation."); }
}
