import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryRequest, requireTrustAlignmentVerificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustAlignmentVerificationUser(); return apiSuccess(await registryRequest()); } catch (error) { return apiError(error, "Unable to inspect alignment registry."); } }
export async function POST(request: Request) { try { await requireTrustAlignmentVerificationUser(); return apiSuccess(await registryRequest(request)); } catch (error) { return apiError(error, "Unable to project alignment registry."); } }
