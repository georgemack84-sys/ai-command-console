import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageRequest, requirePhase14CertificationGateUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePhase14CertificationGateUser(); return apiSuccess(await lineageRequest()); } catch (error) { return apiError(error, "Unable to load Phase 14 certification lineage."); } }
export async function POST(request: Request) { try { await requirePhase14CertificationGateUser(); return apiSuccess(await lineageRequest(request)); } catch (error) { return apiError(error, "Unable to load Phase 14 certification lineage."); } }
