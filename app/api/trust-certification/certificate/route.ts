import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificateRequest, requireTrustCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustCertificationUser(); return apiSuccess(await certificateRequest()); } catch (error) { return apiError(error, "Unable to load Trust Certificate."); } }
export async function POST(request: Request) { try { await requireTrustCertificationUser(); return apiSuccess(await certificateRequest(request)); } catch (error) { return apiError(error, "Unable to generate Trust Certificate."); } }
