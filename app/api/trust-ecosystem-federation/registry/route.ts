import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryRequest, requireTrustFederationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustFederationUser(); return apiSuccess(await registryRequest()); } catch (error) { return apiError(error, "Unable to load Federation registry."); } }
export async function POST(request: Request) { try { await requireTrustFederationUser(); return apiSuccess(await registryRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Federation registry."); } }
