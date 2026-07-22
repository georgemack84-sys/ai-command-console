import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireKnowledgeRepositoryUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireKnowledgeRepositoryUser(); return apiSuccess(await ledgerRequest(request)); }
  catch (error) { return apiError(error, "Unable to list evolution ledger entries."); }
}
