import { readinessRequest, requirePhase16CertificationGateUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePhase16CertificationGateUser(); return apiSuccess(await readinessRequest()); } catch (error) { return apiError(error, "Unable to load Phase 16 expansion readiness."); } }
export async function POST(request: Request) { try { await requirePhase16CertificationGateUser(); return apiSuccess(await readinessRequest(request)); } catch (error) { return apiError(error, "Unable to load Phase 16 expansion readiness."); } }
