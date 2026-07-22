import { apiError, apiSuccess } from "@/src/server/api/response";
import { dependencyRequest, requireSpecificationIntegrityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSpecificationIntegrityUser(); return apiSuccess(await dependencyRequest()); } catch (error) { return apiError(error, "Unable to validate dependency consistency."); } }
export async function POST(request: Request) { try { await requireSpecificationIntegrityUser(); return apiSuccess(await dependencyRequest(request)); } catch (error) { return apiError(error, "Unable to validate dependency consistency."); } }
