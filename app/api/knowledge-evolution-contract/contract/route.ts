import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractRequest, contractResponse, requireKnowledgeEvolutionUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireKnowledgeEvolutionUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load knowledge evolution contract."); }
}
export async function POST(request: Request) {
  try { await requireKnowledgeEvolutionUser(); return apiSuccess(await contractRequest(request)); }
  catch (error) { return apiError(error, "Unable to build knowledge evolution contract."); }
}
