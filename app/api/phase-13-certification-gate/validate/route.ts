import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePhase13CertificationUser, validateRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requirePhase13CertificationUser(); return apiSuccess(await validateRequest(request)); } catch (error) { return apiError(error, "Unable to validate Phase 13 certification gate."); } }
