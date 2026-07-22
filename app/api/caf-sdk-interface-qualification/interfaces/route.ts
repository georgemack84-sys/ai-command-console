import { apiError, apiSuccess } from "@/src/server/api/response";
import { interfacesRequest, requireSdkInterfaceQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSdkInterfaceQualificationUser(); return apiSuccess(await interfacesRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF interface certification."); } }
export async function POST(request: Request) { try { await requireSdkInterfaceQualificationUser(); return apiSuccess(await interfacesRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF interface certification."); } }
