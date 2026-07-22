import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationRequest, requireAssuranceDependencyGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceDependencyGovernanceUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load dependency governance certification."); } }
export async function POST(request: Request) { try { await requireAssuranceDependencyGovernanceUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load dependency governance certification."); } }
