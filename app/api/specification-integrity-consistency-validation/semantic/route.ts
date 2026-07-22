import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireSpecificationIntegrityUser, semanticRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSpecificationIntegrityUser(); return apiSuccess(await semanticRequest()); } catch (error) { return apiError(error, "Unable to validate semantic integrity."); } }
export async function POST(request: Request) { try { await requireSpecificationIntegrityUser(); return apiSuccess(await semanticRequest(request)); } catch (error) { return apiError(error, "Unable to validate semantic integrity."); } }
