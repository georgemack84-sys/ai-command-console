import { managerRequest, requireCrossRegionReplicationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireCrossRegionReplicationUser(); return apiSuccess(await managerRequest()); } catch (error) { return apiError(error, "Unable to read replication manager."); } }
export async function POST(request: Request) { try { await requireCrossRegionReplicationUser(); return apiSuccess(await managerRequest(request)); } catch (error) { return apiError(error, "Unable to read replication manager."); } }
