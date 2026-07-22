import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, inspectRequest, requireOperatorVisibilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireOperatorVisibilityUser(); return apiSuccess(await inspectRequest()); } catch (error) { return apiError(error, "Unable to inspect operator visibility certification."); } }
export async function POST(request: Request) { try { await requireOperatorVisibilityUser(); return apiSuccess(await dashboardRequest(request)); } catch (error) { return apiError(error, "Unable to certify operator visibility."); } }
