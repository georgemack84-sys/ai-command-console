import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireSyntheticValidationFoundationUser, resultRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticValidationFoundationUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run synthetic validation foundation."); } }
export async function POST(request: Request) { try { await requireSyntheticValidationFoundationUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run synthetic validation foundation."); } }
