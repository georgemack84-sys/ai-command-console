import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireProgramQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProgramQualificationUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF replay qualification."); } }
export async function POST(request: Request) { try { await requireProgramQualificationUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF replay qualification."); } }
