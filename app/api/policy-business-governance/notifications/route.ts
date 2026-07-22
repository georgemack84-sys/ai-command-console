import { apiError, apiSuccess } from "@/src/server/api/response";
import { notificationsRequest, requirePbgUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePbgUser(); return apiSuccess(await notificationsRequest()); } catch (error) { return apiError(error, "Unable to inspect PBG notifications."); } }
export async function POST(request: Request) { try { await requirePbgUser(); return apiSuccess(await notificationsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect PBG notifications."); } }
