import { requirePhase17CertificationGateUser, validateRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function POST(request: Request) { try { await requirePhase17CertificationGateUser(); return apiSuccess(await validateRequest(request)); } catch (error) { return apiError(error, "Unable to validate Phase 17 Certification Gate."); } }
