import { apiError, apiSuccess } from "@/src/server/api/response";
import { architectureRequest, requireApplicationCapabilityCompositionUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationCapabilityCompositionUser(); return apiSuccess(await architectureRequest()); } catch (error) { return apiError(error, "Unable to inspect capability architecture."); } }
export async function POST(request: Request) { try { await requireApplicationCapabilityCompositionUser(); return apiSuccess(await architectureRequest(request)); } catch (error) { return apiError(error, "Unable to inspect capability architecture."); } }
