import { preconditionsRequest, requirePhase16CertificationGateUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePhase16CertificationGateUser(); return apiSuccess(await preconditionsRequest()); } catch (error) { return apiError(error, "Unable to load Phase 16 certification preconditions."); } }
export async function POST(request: Request) { try { await requirePhase16CertificationGateUser(); return apiSuccess(await preconditionsRequest(request)); } catch (error) { return apiError(error, "Unable to load Phase 16 certification preconditions."); } }
