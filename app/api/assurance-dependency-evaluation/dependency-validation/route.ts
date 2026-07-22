import { apiError, apiSuccess } from "@/src/server/api/response";
import { dependencyValidationRequest, requireAssuranceDependencyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceDependencyUser(); return apiSuccess(await dependencyValidationRequest()); } catch (error) { return apiError(error, "Unable to validate assurance dependencies."); } }
export async function POST(request: Request) { try { await requireAssuranceDependencyUser(); return apiSuccess(await dependencyValidationRequest(request)); } catch (error) { return apiError(error, "Unable to validate assurance dependencies."); } }
