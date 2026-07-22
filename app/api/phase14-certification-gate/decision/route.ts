import { apiError, apiSuccess } from "@/src/server/api/response";
import { decisionRequest, requirePhase14CertificationGateUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePhase14CertificationGateUser(); return apiSuccess(await decisionRequest()); } catch (error) { return apiError(error, "Unable to load Phase 14 certification decision."); } }
export async function POST(request: Request) { try { await requirePhase14CertificationGateUser(); return apiSuccess(await decisionRequest(request)); } catch (error) { return apiError(error, "Unable to load Phase 14 certification decision."); } }
