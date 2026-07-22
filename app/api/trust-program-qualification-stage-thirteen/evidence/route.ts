import { NextResponse } from "next/server";
import { evidenceRequest, requireTrustProgramQualificationStageThirteenUser } from "../core";

export async function GET() { await requireTrustProgramQualificationStageThirteenUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireTrustProgramQualificationStageThirteenUser(); return NextResponse.json(await evidenceRequest(request)); }
