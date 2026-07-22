import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireSpecificationGovernanceUser, supersessionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSpecificationGovernanceUser(); return apiSuccess(await supersessionRequest()); } catch (error) { return apiError(error, "Unable to retrieve specification supersession manager."); } }
export async function POST(request: Request) { try { await requireSpecificationGovernanceUser(); return apiSuccess(await supersessionRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve specification supersession manager."); } }
