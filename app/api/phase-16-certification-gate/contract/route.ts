import { contractResponse, requirePhase16CertificationGateUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePhase16CertificationGateUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Phase 16 Certification Gate contract."); } }
