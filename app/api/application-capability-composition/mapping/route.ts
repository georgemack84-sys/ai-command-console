import { apiError, apiSuccess } from "@/src/server/api/response";
import { mappingRequest, requireApplicationCapabilityCompositionUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationCapabilityCompositionUser(); return apiSuccess(await mappingRequest()); } catch (error) { return apiError(error, "Unable to inspect capability mapping."); } }
export async function POST(request: Request) { try { await requireApplicationCapabilityCompositionUser(); return apiSuccess(await mappingRequest(request)); } catch (error) { return apiError(error, "Unable to inspect capability mapping."); } }
