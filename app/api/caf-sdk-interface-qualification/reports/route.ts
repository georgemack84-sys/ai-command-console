import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportsRequest, requireSdkInterfaceQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSdkInterfaceQualificationUser(); return apiSuccess(await reportsRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF interface reports."); } }
export async function POST(request: Request) { try { await requireSdkInterfaceQualificationUser(); return apiSuccess(await reportsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF interface reports."); } }
