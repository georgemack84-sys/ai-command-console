import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requirePhase12CertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePhase12CertificationUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to inspect Phase 12 certification evidence."); } }
export async function POST(request: Request) { try { await requirePhase12CertificationUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect Phase 12 certification evidence."); } }
