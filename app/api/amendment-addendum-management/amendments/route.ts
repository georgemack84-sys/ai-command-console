import { apiError, apiSuccess } from "@/src/server/api/response";
import { amendmentsRequest, requireAmendmentAddendumUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAmendmentAddendumUser(); return apiSuccess(await amendmentsRequest()); } catch (error) { return apiError(error, "Unable to retrieve amendment registry."); } }
export async function POST(request: Request) { try { await requireAmendmentAddendumUser(); return apiSuccess(await amendmentsRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve amendment registry."); } }
