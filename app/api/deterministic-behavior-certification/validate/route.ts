import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDeterministicBehaviorUser, validateRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireDeterministicBehaviorUser(); return apiSuccess(await validateRequest(request)); } catch (error) { return apiError(error, "Unable to validate deterministic behavior certification."); } }
