import { apiError, apiSuccess } from "@/src/server/api/response";
import { authorityRequest, requireApplicationGovernanceBindingUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationGovernanceBindingUser(); return apiSuccess(await authorityRequest()); } catch (error) { return apiError(error, "Unable to inspect authority binding."); } }
export async function POST(request: Request) { try { await requireApplicationGovernanceBindingUser(); return apiSuccess(await authorityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect authority binding."); } }
