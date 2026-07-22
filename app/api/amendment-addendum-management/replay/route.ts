import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireAmendmentAddendumUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAmendmentAddendumUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to replay amendment addendum management."); } }
export async function POST(request: Request) { try { await requireAmendmentAddendumUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to replay amendment addendum management."); } }
