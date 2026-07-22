import { apiError, apiSuccess } from "@/src/server/api/response";
import { recordsRequest, requireKnowledgeRepositoryUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireKnowledgeRepositoryUser(); return apiSuccess(await recordsRequest(request)); }
  catch (error) { return apiError(error, "Unable to list knowledge repository records."); }
}
