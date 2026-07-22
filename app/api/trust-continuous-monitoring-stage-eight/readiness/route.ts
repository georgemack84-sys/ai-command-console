import { NextResponse } from "next/server";
import { readinessRequest, requireTrustContinuousMonitoringStageEightUser } from "../core";

export async function GET() { await requireTrustContinuousMonitoringStageEightUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireTrustContinuousMonitoringStageEightUser(); return NextResponse.json(await readinessRequest(request)); }
