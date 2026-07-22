import { NextResponse } from "next/server";
import { replayRequest, requireTrustProgramQualificationUser } from "../core";

export async function GET() { await requireTrustProgramQualificationUser(); return NextResponse.json(await replayRequest()); }
export async function POST(request: Request) { await requireTrustProgramQualificationUser(); return NextResponse.json(await replayRequest(request)); }
