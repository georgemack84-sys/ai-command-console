import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageRequest, requireApplicationCapabilityCompositionUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationCapabilityCompositionUser(); return apiSuccess(await lineageRequest()); } catch (error) { return apiError(error, "Unable to inspect capability lineage."); } }
export async function POST(request: Request) { try { await requireApplicationCapabilityCompositionUser(); return apiSuccess(await lineageRequest(request)); } catch (error) { return apiError(error, "Unable to inspect capability lineage."); } }
