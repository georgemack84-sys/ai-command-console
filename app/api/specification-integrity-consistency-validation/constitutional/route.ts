import { apiError, apiSuccess } from "@/src/server/api/response";
import { constitutionalRequest, requireSpecificationIntegrityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSpecificationIntegrityUser(); return apiSuccess(await constitutionalRequest()); } catch (error) { return apiError(error, "Unable to validate constitutional consistency."); } }
export async function POST(request: Request) { try { await requireSpecificationIntegrityUser(); return apiSuccess(await constitutionalRequest(request)); } catch (error) { return apiError(error, "Unable to validate constitutional consistency."); } }
