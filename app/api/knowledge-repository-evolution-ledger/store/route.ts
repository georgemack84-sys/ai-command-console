import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireKnowledgeRepositoryUser, storeRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireKnowledgeRepositoryUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load knowledge repository evolution ledger."); }
}
export async function POST(request: Request) {
  try { await requireKnowledgeRepositoryUser(); return apiSuccess(await storeRequest(request)); }
  catch (error) { return apiError(error, "Unable to store knowledge repository projection."); }
}
