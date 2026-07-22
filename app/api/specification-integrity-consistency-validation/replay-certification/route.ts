import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayCertificationRequest, requireSpecificationIntegrityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSpecificationIntegrityUser(); return apiSuccess(await replayCertificationRequest()); } catch (error) { return apiError(error, "Unable to validate replay certification consistency."); } }
export async function POST(request: Request) { try { await requireSpecificationIntegrityUser(); return apiSuccess(await replayCertificationRequest(request)); } catch (error) { return apiError(error, "Unable to validate replay certification consistency."); } }
