import { NextResponse } from "next/server";
import { monitoringRequest, requireTrustContinuousMonitoringStageEightUser } from "../core";

export async function GET() { await requireTrustContinuousMonitoringStageEightUser(); return NextResponse.json(await monitoringRequest()); }
export async function POST(request: Request) { await requireTrustContinuousMonitoringStageEightUser(); return NextResponse.json(await monitoringRequest(request)); }
