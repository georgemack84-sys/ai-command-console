import { activationRequest, requireKnowledgeEvolutionUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireKnowledgeEvolutionUser(); return apiSuccess(await activationRequest(request)); }
  catch (error) { return apiError(error, "Unable to load knowledge activation contract."); }
}
