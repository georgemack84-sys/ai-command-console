import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireApplicationCapabilityCompositionUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationCapabilityCompositionUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to inspect composition governance evidence."); } }
export async function POST(request: Request) { try { await requireApplicationCapabilityCompositionUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect composition governance evidence."); } }
