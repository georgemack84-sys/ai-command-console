import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requirePhase12CertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePhase12CertificationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect Phase 12 certification contract."); } }
