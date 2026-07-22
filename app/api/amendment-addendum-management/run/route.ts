import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAmendmentAddendumUser, resultRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAmendmentAddendumUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run amendment addendum management."); } }
export async function POST(request: Request) { try { await requireAmendmentAddendumUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run amendment addendum management."); } }
