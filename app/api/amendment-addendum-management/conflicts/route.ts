import { apiError, apiSuccess } from "@/src/server/api/response";
import { conflictsRequest, requireAmendmentAddendumUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAmendmentAddendumUser(); return apiSuccess(await conflictsRequest()); } catch (error) { return apiError(error, "Unable to retrieve conflict resolution engine."); } }
export async function POST(request: Request) { try { await requireAmendmentAddendumUser(); return apiSuccess(await conflictsRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve conflict resolution engine."); } }
