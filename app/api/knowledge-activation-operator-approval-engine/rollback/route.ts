import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireKnowledgeActivationUser, rollbackRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireKnowledgeActivationUser(); return apiSuccess(await rollbackRequest(request)); }
  catch (error) { return apiError(error, "Unable to list knowledge rollback records."); }
}
