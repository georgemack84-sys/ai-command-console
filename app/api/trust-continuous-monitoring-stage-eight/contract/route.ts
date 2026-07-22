import { NextResponse } from "next/server";
import { contractResponse, requireTrustContinuousMonitoringStageEightUser } from "../core";

export async function GET() { await requireTrustContinuousMonitoringStageEightUser(); return NextResponse.json(contractResponse()); }
