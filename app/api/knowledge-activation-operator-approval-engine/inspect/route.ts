import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireKnowledgeActivationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireKnowledgeActivationUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect knowledge activation."); }
}
export async function POST(request: Request) {
  try { await requireKnowledgeActivationUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect knowledge activation."); }
}
