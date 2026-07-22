import { apiError, apiSuccess } from "@/src/server/api/response";
import { lifecycleRequest, requireSyntheticValidationFoundationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticValidationFoundationUser(); return apiSuccess(await lifecycleRequest()); } catch (error) { return apiError(error, "Unable to load synthetic validation lifecycle."); } }
export async function POST(request: Request) { try { await requireSyntheticValidationFoundationUser(); return apiSuccess(await lifecycleRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic validation lifecycle."); } }
