import { apiError, apiSuccess } from "@/src/server/api/response";
import { observabilityRequest, requireTrustCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustCertificationUser(); return apiSuccess(await observabilityRequest()); } catch (error) { return apiError(error, "Unable to load Trust Certification observability."); } }
export async function POST(request: Request) { try { await requireTrustCertificationUser(); return apiSuccess(await observabilityRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Certification observability."); } }
