import { apiError, apiSuccess } from "@/src/server/api/response";
import { attestationRequest, requireTrustCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustCertificationUser(); return apiSuccess(await attestationRequest()); } catch (error) { return apiError(error, "Unable to load Trust Attestation."); } }
export async function POST(request: Request) { try { await requireTrustCertificationUser(); return apiSuccess(await attestationRequest(request)); } catch (error) { return apiError(error, "Unable to generate Trust Attestation."); } }
