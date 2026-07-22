import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireCertificationDecisionUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCertificationDecisionUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to replay certification decision."); } }
export async function POST(request: Request) { try { await requireCertificationDecisionUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to replay certification decision."); } }
