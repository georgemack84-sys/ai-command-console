import { apiError, apiSuccess } from "@/src/server/api/response";
import { dependenciesRequest, requireCapabilityCompositionUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCapabilityCompositionUser(); return apiSuccess(await dependenciesRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF composition dependencies."); } }
export async function POST(request: Request) { try { await requireCapabilityCompositionUser(); return apiSuccess(await dependenciesRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF composition dependencies."); } }
