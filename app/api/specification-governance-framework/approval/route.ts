import { apiError, apiSuccess } from "@/src/server/api/response";
import { approvalRequest, requireSpecificationGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSpecificationGovernanceUser(); return apiSuccess(await approvalRequest()); } catch (error) { return apiError(error, "Unable to retrieve specification approval workflow."); } }
export async function POST(request: Request) { try { await requireSpecificationGovernanceUser(); return apiSuccess(await approvalRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve specification approval workflow."); } }
