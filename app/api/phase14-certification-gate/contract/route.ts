import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requirePhase14CertificationGateUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePhase14CertificationGateUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Phase 14 certification gate contract."); } }
