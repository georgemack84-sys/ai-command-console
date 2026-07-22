import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireTrustCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustCertificationUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to load Trust Certification governance."); } }
export async function POST(request: Request) { try { await requireTrustCertificationUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Certification governance."); } }
