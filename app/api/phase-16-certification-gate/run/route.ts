import { requirePhase16CertificationGateUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePhase16CertificationGateUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Phase 16 Certification Gate."); } }
export async function POST(request: Request) { try { await requirePhase16CertificationGateUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Phase 16 Certification Gate."); } }
