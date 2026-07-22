import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageRequest, requireCapabilityCompositionUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCapabilityCompositionUser(); return apiSuccess(await lineageRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF composition lineage."); } }
export async function POST(request: Request) { try { await requireCapabilityCompositionUser(); return apiSuccess(await lineageRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF composition lineage."); } }
