import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePhase14CertificationGateUser, validateRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requirePhase14CertificationGateUser(); return apiSuccess(await validateRequest(request)); } catch (error) { return apiError(error, "Unable to validate Phase 14 certification gate."); } }
