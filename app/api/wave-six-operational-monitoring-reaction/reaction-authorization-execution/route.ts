import { NextResponse } from "next/server";
import { reactionAuthorizationExecutionRequest, requireWaveSixOperationalMonitoringReactionUser } from "../core";

export async function GET() { await requireWaveSixOperationalMonitoringReactionUser(); return NextResponse.json(await reactionAuthorizationExecutionRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalMonitoringReactionUser(); return NextResponse.json(await reactionAuthorizationExecutionRequest(request)); }
