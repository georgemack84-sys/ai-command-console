import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireSpecificationGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSpecificationGovernanceUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to replay specification governance."); } }
export async function POST(request: Request) { try { await requireSpecificationGovernanceUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to replay specification governance."); } }
