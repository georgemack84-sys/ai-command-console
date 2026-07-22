import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requestActivation, requireKnowledgeActivationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireKnowledgeActivationUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load knowledge activation operator approval engine."); }
}
export async function POST(request: Request) {
  try { await requireKnowledgeActivationUser(); return apiSuccess(await requestActivation(request)); }
  catch (error) { return apiError(error, "Unable to request knowledge activation."); }
}
