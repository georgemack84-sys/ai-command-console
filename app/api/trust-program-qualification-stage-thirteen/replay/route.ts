import { NextResponse } from "next/server";
import { replayRequest, requireTrustProgramQualificationStageThirteenUser } from "../core";

export async function GET() { await requireTrustProgramQualificationStageThirteenUser(); return NextResponse.json(await replayRequest()); }
export async function POST(request: Request) { await requireTrustProgramQualificationStageThirteenUser(); return NextResponse.json(await replayRequest(request)); }
