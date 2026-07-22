import { NextResponse } from "next/server";
import { requireTrustContinuousMonitoringStageEightUser, standingRequest } from "../core";

export async function GET() { await requireTrustContinuousMonitoringStageEightUser(); return NextResponse.json(await standingRequest()); }
export async function POST(request: Request) { await requireTrustContinuousMonitoringStageEightUser(); return NextResponse.json(await standingRequest(request)); }
