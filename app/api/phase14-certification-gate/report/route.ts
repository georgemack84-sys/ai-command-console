import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportRequest, requirePhase14CertificationGateUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePhase14CertificationGateUser(); return apiSuccess(await reportRequest()); } catch (error) { return apiError(error, "Unable to load Phase 14 certification report."); } }
export async function POST(request: Request) { try { await requirePhase14CertificationGateUser(); return apiSuccess(await reportRequest(request)); } catch (error) { return apiError(error, "Unable to load Phase 14 certification report."); } }
