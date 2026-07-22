import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAssuranceDependencyGovernanceUser, verificationRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceDependencyGovernanceUser(); return apiSuccess(await verificationRequest()); } catch (error) { return apiError(error, "Unable to load dependency verification."); } }
export async function POST(request: Request) { try { await requireAssuranceDependencyGovernanceUser(); return apiSuccess(await verificationRequest(request)); } catch (error) { return apiError(error, "Unable to load dependency verification."); } }
