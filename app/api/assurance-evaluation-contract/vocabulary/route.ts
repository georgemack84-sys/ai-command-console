import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAssuranceEvaluationUser, vocabularyRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceEvaluationUser(); return apiSuccess(await vocabularyRequest()); } catch (error) { return apiError(error, "Unable to inspect assurance result vocabulary."); } }
export async function POST(request: Request) { try { await requireAssuranceEvaluationUser(); return apiSuccess(await vocabularyRequest(request)); } catch (error) { return apiError(error, "Unable to inspect assurance result vocabulary."); } }
