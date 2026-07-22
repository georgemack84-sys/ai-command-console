import { apiError, apiSuccess } from "@/src/server/api/response";
import { policyRequest, requireApplicationGovernanceBindingUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationGovernanceBindingUser(); return apiSuccess(await policyRequest()); } catch (error) { return apiError(error, "Unable to inspect policy compliance."); } }
export async function POST(request: Request) { try { await requireApplicationGovernanceBindingUser(); return apiSuccess(await policyRequest(request)); } catch (error) { return apiError(error, "Unable to inspect policy compliance."); } }
