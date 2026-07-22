import { apiError, apiSuccess } from "@/src/server/api/response";
import { approvalsRequest, requireApplicationGovernanceBindingUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationGovernanceBindingUser(); return apiSuccess(await approvalsRequest()); } catch (error) { return apiError(error, "Unable to inspect approval routing."); } }
export async function POST(request: Request) { try { await requireApplicationGovernanceBindingUser(); return apiSuccess(await approvalsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect approval routing."); } }
