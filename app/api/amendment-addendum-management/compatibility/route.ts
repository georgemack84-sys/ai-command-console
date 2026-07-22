import { apiError, apiSuccess } from "@/src/server/api/response";
import { compatibilityRequest, requireAmendmentAddendumUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAmendmentAddendumUser(); return apiSuccess(await compatibilityRequest()); } catch (error) { return apiError(error, "Unable to retrieve compatibility validation."); } }
export async function POST(request: Request) { try { await requireAmendmentAddendumUser(); return apiSuccess(await compatibilityRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve compatibility validation."); } }
