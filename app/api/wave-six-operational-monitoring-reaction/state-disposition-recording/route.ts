import { NextResponse } from "next/server";
import { requireWaveSixOperationalMonitoringReactionUser, stateDispositionRecordingRequest } from "../core";

export async function GET() { await requireWaveSixOperationalMonitoringReactionUser(); return NextResponse.json(await stateDispositionRecordingRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalMonitoringReactionUser(); return NextResponse.json(await stateDispositionRecordingRequest(request)); }
