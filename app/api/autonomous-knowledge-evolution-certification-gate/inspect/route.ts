import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireAutonomousKnowledgeCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireAutonomousKnowledgeCertificationUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect autonomous knowledge certification."); }
}
export async function POST(request: Request) {
  try { await requireAutonomousKnowledgeCertificationUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect autonomous knowledge certification."); }
}
