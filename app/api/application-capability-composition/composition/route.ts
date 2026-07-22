import { apiError, apiSuccess } from "@/src/server/api/response";
import { compositionRequest, requireApplicationCapabilityCompositionUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationCapabilityCompositionUser(); return apiSuccess(await compositionRequest()); } catch (error) { return apiError(error, "Unable to inspect capability composition graph."); } }
export async function POST(request: Request) { try { await requireApplicationCapabilityCompositionUser(); return apiSuccess(await compositionRequest(request)); } catch (error) { return apiError(error, "Unable to inspect capability composition graph."); } }
