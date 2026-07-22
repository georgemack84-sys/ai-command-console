import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryRequest, requireTrustCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustCertificationUser(); return apiSuccess(await registryRequest()); } catch (error) { return apiError(error, "Unable to load Trust Certification registry."); } }
export async function POST(request: Request) { try { await requireTrustCertificationUser(); return apiSuccess(await registryRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Certification registry."); } }
