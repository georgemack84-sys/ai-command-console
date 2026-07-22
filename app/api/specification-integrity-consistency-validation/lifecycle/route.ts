import { apiError, apiSuccess } from "@/src/server/api/response";
import { lifecycleRequest, requireSpecificationIntegrityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSpecificationIntegrityUser(); return apiSuccess(await lifecycleRequest()); } catch (error) { return apiError(error, "Unable to validate lifecycle consistency."); } }
export async function POST(request: Request) { try { await requireSpecificationIntegrityUser(); return apiSuccess(await lifecycleRequest(request)); } catch (error) { return apiError(error, "Unable to validate lifecycle consistency."); } }
