import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requirePhase13CertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePhase13CertificationUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to replay Phase 13 certification."); } }
export async function POST(request: Request) { try { await requirePhase13CertificationUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to replay Phase 13 certification."); } }
