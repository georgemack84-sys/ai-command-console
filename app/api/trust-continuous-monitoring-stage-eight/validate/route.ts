import { NextResponse } from "next/server";
import { requireTrustContinuousMonitoringStageEightUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireTrustContinuousMonitoringStageEightUser(); return NextResponse.json(await validateRequest(request)); }
