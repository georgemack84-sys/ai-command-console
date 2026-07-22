import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireTrustCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustCertificationUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to load Trust Certification evidence."); } }
export async function POST(request: Request) { try { await requireTrustCertificationUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Certification evidence."); } }
