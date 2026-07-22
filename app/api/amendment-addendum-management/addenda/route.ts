import { apiError, apiSuccess } from "@/src/server/api/response";
import { addendaRequest, requireAmendmentAddendumUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAmendmentAddendumUser(); return apiSuccess(await addendaRequest()); } catch (error) { return apiError(error, "Unable to retrieve addendum registry."); } }
export async function POST(request: Request) { try { await requireAmendmentAddendumUser(); return apiSuccess(await addendaRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve addendum registry."); } }
