import { apiError, apiSuccess } from "@/src/server/api/response";
import { qualificationRequest, requireQciUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireQciUser(); return apiSuccess(await qualificationRequest()); } catch (error) { return apiError(error, "Unable to inspect QCI qualification."); } }
export async function POST(request: Request) { try { await requireQciUser(); return apiSuccess(await qualificationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect QCI qualification."); } }
