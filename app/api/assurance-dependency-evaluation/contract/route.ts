import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAssuranceDependencyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceDependencyUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect assurance dependency contract."); } }
