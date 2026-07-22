import { apiError, apiSuccess } from "@/src/server/api/response";
import { dependenciesRequest, requireApplicationCapabilityCompositionUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationCapabilityCompositionUser(); return apiSuccess(await dependenciesRequest()); } catch (error) { return apiError(error, "Unable to inspect capability dependency map."); } }
export async function POST(request: Request) { try { await requireApplicationCapabilityCompositionUser(); return apiSuccess(await dependenciesRequest(request)); } catch (error) { return apiError(error, "Unable to inspect capability dependency map."); } }
