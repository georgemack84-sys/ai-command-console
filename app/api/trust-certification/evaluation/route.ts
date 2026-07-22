import { apiError, apiSuccess } from "@/src/server/api/response";
import { evaluationRequest, requireTrustCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustCertificationUser(); return apiSuccess(await evaluationRequest()); } catch (error) { return apiError(error, "Unable to load Trust Certification evaluation."); } }
export async function POST(request: Request) { try { await requireTrustCertificationUser(); return apiSuccess(await evaluationRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Certification."); } }
