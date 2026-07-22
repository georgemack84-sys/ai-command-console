import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireTrustCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustCertificationUser(); return apiSuccess(await readinessRequest()); } catch (error) { return apiError(error, "Unable to load Trust Certification readiness."); } }
export async function POST(request: Request) { try { await requireTrustCertificationUser(); return apiSuccess(await readinessRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Certification readiness."); } }
