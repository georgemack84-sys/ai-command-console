import { apiError, apiSuccess } from "@/src/server/api/response";
import { crossReferenceRequest, requireSpecificationIntegrityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSpecificationIntegrityUser(); return apiSuccess(await crossReferenceRequest()); } catch (error) { return apiError(error, "Unable to validate specification cross references."); } }
export async function POST(request: Request) { try { await requireSpecificationIntegrityUser(); return apiSuccess(await crossReferenceRequest(request)); } catch (error) { return apiError(error, "Unable to validate specification cross references."); } }
