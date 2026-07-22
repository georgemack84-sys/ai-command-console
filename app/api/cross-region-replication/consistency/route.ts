import { consistencyRequest, requireCrossRegionReplicationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireCrossRegionReplicationUser(); return apiSuccess(await consistencyRequest()); } catch (error) { return apiError(error, "Unable to read replication consistency."); } }
export async function POST(request: Request) { try { await requireCrossRegionReplicationUser(); return apiSuccess(await consistencyRequest(request)); } catch (error) { return apiError(error, "Unable to read replication consistency."); } }
