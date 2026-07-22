import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireKnowledgeValidationUser, resultRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireKnowledgeValidationUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect knowledge validation governance."); }
}
export async function POST(request: Request) {
  try { await requireKnowledgeValidationUser(); return apiSuccess(await resultRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect knowledge validation governance."); }
}
