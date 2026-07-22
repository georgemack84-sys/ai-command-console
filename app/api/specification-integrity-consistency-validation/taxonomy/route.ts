import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireSpecificationIntegrityUser, taxonomyRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSpecificationIntegrityUser(); return apiSuccess(await taxonomyRequest()); } catch (error) { return apiError(error, "Unable to validate document taxonomy consistency."); } }
export async function POST(request: Request) { try { await requireSpecificationIntegrityUser(); return apiSuccess(await taxonomyRequest(request)); } catch (error) { return apiError(error, "Unable to validate document taxonomy consistency."); } }
