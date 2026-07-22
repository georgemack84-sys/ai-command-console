import { contractResponse, requirePhase17CertificationGateUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePhase17CertificationGateUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to read Phase 17 Certification Gate contract."); } }
