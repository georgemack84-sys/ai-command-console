import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTrustCertificationUser, scopeRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustCertificationUser(); return apiSuccess(await scopeRequest()); } catch (error) { return apiError(error, "Unable to load Trust Certification scope."); } }
export async function POST(request: Request) { try { await requireTrustCertificationUser(); return apiSuccess(await scopeRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Certification scope."); } }
