import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryRequest, requireCapabilityCompositionUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCapabilityCompositionUser(); return apiSuccess(await registryRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF composition registry."); } }
export async function POST(request: Request) { try { await requireCapabilityCompositionUser(); return apiSuccess(await registryRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF composition registry."); } }
