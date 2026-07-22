import { apiError, apiSuccess } from "@/src/server/api/response";
import { auditRequest, requireKnowledgeValidationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireKnowledgeValidationUser(); return apiSuccess(await auditRequest(request)); }
  catch (error) { return apiError(error, "Unable to list knowledge validation audit records."); }
}
