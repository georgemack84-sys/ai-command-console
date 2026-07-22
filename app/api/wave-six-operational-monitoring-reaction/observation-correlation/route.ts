import { NextResponse } from "next/server";
import { observationCorrelationRequest, requireWaveSixOperationalMonitoringReactionUser } from "../core";

export async function GET() { await requireWaveSixOperationalMonitoringReactionUser(); return NextResponse.json(await observationCorrelationRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalMonitoringReactionUser(); return NextResponse.json(await observationCorrelationRequest(request)); }
