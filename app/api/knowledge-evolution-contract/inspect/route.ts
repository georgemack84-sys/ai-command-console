import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireKnowledgeEvolutionUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireKnowledgeEvolutionUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect knowledge evolution contract."); }
}
export async function POST(request: Request) {
  try { await requireKnowledgeEvolutionUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect knowledge evolution contract."); }
}
