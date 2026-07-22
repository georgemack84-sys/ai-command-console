import { apiError, apiSuccess } from "@/src/server/api/response";
import { failuresRequest, requireAutonomousKnowledgeCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomousKnowledgeCertificationUser(); return apiSuccess(await failuresRequest(request)); }
  catch (error) { return apiError(error, "Unable to list certification failures."); }
}
