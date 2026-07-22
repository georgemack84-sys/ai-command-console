import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireCapabilityCompositionUser, skillsRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCapabilityCompositionUser(); return apiSuccess(await skillsRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF skill registry."); } }
export async function POST(request: Request) { try { await requireCapabilityCompositionUser(); return apiSuccess(await skillsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF skill registry."); } }
