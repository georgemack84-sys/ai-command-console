import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireSyntheticValidationFoundationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticValidationFoundationUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to load synthetic validation governance."); } }
export async function POST(request: Request) { try { await requireSyntheticValidationFoundationUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic validation governance."); } }
