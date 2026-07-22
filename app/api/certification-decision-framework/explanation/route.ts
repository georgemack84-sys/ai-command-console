import { apiError, apiSuccess } from "@/src/server/api/response";
import { explanationRequest, requireCertificationDecisionUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCertificationDecisionUser(); return apiSuccess(await explanationRequest()); } catch (error) { return apiError(error, "Unable to inspect certification explanation."); } }
export async function POST(request: Request) { try { await requireCertificationDecisionUser(); return apiSuccess(await explanationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect certification explanation."); } }
