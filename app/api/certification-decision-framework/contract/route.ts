import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireCertificationDecisionUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCertificationDecisionUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect certification decision contract."); } }
