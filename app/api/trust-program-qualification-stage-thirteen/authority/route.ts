import { NextResponse } from "next/server";
import { authorityRequest, requireTrustProgramQualificationStageThirteenUser } from "../core";

export async function GET() { await requireTrustProgramQualificationStageThirteenUser(); return NextResponse.json(await authorityRequest()); }
export async function POST(request: Request) { await requireTrustProgramQualificationStageThirteenUser(); return NextResponse.json(await authorityRequest(request)); }
