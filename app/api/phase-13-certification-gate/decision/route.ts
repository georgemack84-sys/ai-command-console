import { apiError, apiSuccess } from "@/src/server/api/response";
import { decisionRequest, requirePhase13CertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePhase13CertificationUser(); return apiSuccess(await decisionRequest()); } catch (error) { return apiError(error, "Unable to retrieve Phase 13 certification decision."); } }
export async function POST(request: Request) { try { await requirePhase13CertificationUser(); return apiSuccess(await decisionRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve Phase 13 certification decision."); } }
