import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireSpecificationIntegrityUser, vocabularyRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSpecificationIntegrityUser(); return apiSuccess(await vocabularyRequest()); } catch (error) { return apiError(error, "Unable to validate specification vocabulary."); } }
export async function POST(request: Request) { try { await requireSpecificationIntegrityUser(); return apiSuccess(await vocabularyRequest(request)); } catch (error) { return apiError(error, "Unable to validate specification vocabulary."); } }
