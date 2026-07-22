import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePhase12CertificationUser, validateRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requirePhase12CertificationUser(); return apiSuccess(await validateRequest(request)); } catch (error) { return apiError(error, "Unable to validate Phase 12 certification gate."); } }
