import { apiError, apiSuccess } from "@/src/server/api/response";
import { certifyRequest, contractResponse, requireAutonomousKnowledgeCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireAutonomousKnowledgeCertificationUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load autonomous knowledge evolution certification gate."); }
}
export async function POST(request: Request) {
  try { await requireAutonomousKnowledgeCertificationUser(); return apiSuccess(await certifyRequest(request)); }
  catch (error) { return apiError(error, "Unable to certify autonomous knowledge evolution."); }
}
