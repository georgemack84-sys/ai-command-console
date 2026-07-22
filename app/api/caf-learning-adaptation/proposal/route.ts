import { apiError, apiSuccess } from "@/src/server/api/response";
import { proposalRequest, requireLearningAdaptationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireLearningAdaptationUser(); return apiSuccess(await proposalRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF adaptation proposal."); } }
export async function POST(request: Request) { try { await requireLearningAdaptationUser(); return apiSuccess(await proposalRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF adaptation proposal."); } }
