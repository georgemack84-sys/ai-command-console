import { activeRequest, requireKnowledgeActivationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireKnowledgeActivationUser(); return apiSuccess(await activeRequest(request)); }
  catch (error) { return apiError(error, "Unable to list active knowledge records."); }
}
