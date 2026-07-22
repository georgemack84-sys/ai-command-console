import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireKnowledgeRepositoryUser, validateRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireKnowledgeRepositoryUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect knowledge repository evolution ledger."); }
}
export async function POST(request: Request) {
  try { await requireKnowledgeRepositoryUser(); return apiSuccess(await validateRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect knowledge repository evolution ledger."); }
}
