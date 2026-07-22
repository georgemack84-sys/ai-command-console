import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryRequest, requirePhase12CertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePhase12CertificationUser(); return apiSuccess(await registryRequest()); } catch (error) { return apiError(error, "Unable to inspect Phase 12 certification registry."); } }
export async function POST(request: Request) { try { await requirePhase12CertificationUser(); return apiSuccess(await registryRequest(request)); } catch (error) { return apiError(error, "Unable to inspect Phase 12 certification registry."); } }
