import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requirePhase13CertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePhase13CertificationUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to retrieve Phase 13 certification evidence."); } }
export async function POST(request: Request) { try { await requirePhase13CertificationUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve Phase 13 certification evidence."); } }
