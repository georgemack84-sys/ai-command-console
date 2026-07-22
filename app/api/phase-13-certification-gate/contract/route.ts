import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requirePhase13CertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePhase13CertificationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect Phase 13 certification gate."); } }
