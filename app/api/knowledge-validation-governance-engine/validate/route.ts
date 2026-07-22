import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireKnowledgeValidationUser, validateRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireKnowledgeValidationUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load knowledge validation governance engine."); }
}
export async function POST(request: Request) {
  try { await requireKnowledgeValidationUser(); return apiSuccess(await validateRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate knowledge governance."); }
}
