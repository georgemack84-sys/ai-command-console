import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requirePhase14CertificationGateUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePhase14CertificationGateUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to load Phase 14 certification evidence."); } }
export async function POST(request: Request) { try { await requirePhase14CertificationGateUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to load Phase 14 certification evidence."); } }
