import { apiError, apiSuccess } from "@/src/server/api/response";
import { decisionRequest, requireTrustCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustCertificationUser(); return apiSuccess(await decisionRequest()); } catch (error) { return apiError(error, "Unable to load Trust Certification decision."); } }
export async function POST(request: Request) { try { await requireTrustCertificationUser(); return apiSuccess(await decisionRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Certification decision."); } }
