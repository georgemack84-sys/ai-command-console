import { apiError, apiSuccess } from "@/src/server/api/response";
import { lifecycleRequest, requireTrustCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustCertificationUser(); return apiSuccess(await lifecycleRequest()); } catch (error) { return apiError(error, "Unable to load Trust Certification lifecycle."); } }
export async function POST(request: Request) { try { await requireTrustCertificationUser(); return apiSuccess(await lifecycleRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Certification lifecycle."); } }
