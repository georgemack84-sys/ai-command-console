import { apiError, apiSuccess } from "@/src/server/api/response";
import { processingRequest, requireAmendmentAddendumUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAmendmentAddendumUser(); return apiSuccess(await processingRequest()); } catch (error) { return apiError(error, "Unable to retrieve amendment processing framework."); } }
export async function POST(request: Request) { try { await requireAmendmentAddendumUser(); return apiSuccess(await processingRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve amendment processing framework."); } }
