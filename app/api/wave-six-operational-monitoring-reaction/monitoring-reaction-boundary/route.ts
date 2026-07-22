import { NextResponse } from "next/server";
import { monitoringReactionBoundaryRequest, requireWaveSixOperationalMonitoringReactionUser } from "../core";

export async function GET() { await requireWaveSixOperationalMonitoringReactionUser(); return NextResponse.json(await monitoringReactionBoundaryRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalMonitoringReactionUser(); return NextResponse.json(await monitoringReactionBoundaryRequest(request)); }
