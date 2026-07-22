import { apiError, apiSuccess } from "@/src/server/api/response";
import { approvalRequest, requireHumanOperatorInteractionUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireHumanOperatorInteractionUser(); return apiSuccess(await approvalRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF operator approval."); } }
export async function POST(request: Request) { try { await requireHumanOperatorInteractionUser(); return apiSuccess(await approvalRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF operator approval."); } }
