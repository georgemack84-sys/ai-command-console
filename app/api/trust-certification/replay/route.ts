import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireTrustCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustCertificationUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to load Trust Certification replay."); } }
export async function POST(request: Request) { try { await requireTrustCertificationUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Certification replay."); } }
