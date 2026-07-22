import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePhase14CertificationGateUser, resultRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePhase14CertificationGateUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Phase 14 certification gate."); } }
export async function POST(request: Request) { try { await requirePhase14CertificationGateUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Phase 14 certification gate."); } }
