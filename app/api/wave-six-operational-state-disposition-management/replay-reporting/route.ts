import { NextResponse } from "next/server";
import { replayReportingRequest, requireWaveSixOperationalStateDispositionManagementUser } from "../core";

export async function GET() { await requireWaveSixOperationalStateDispositionManagementUser(); return NextResponse.json(await replayReportingRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalStateDispositionManagementUser(); return NextResponse.json(await replayReportingRequest(request)); }
