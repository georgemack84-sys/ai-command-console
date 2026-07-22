import { NextResponse } from "next/server";
import { findingsRequest, requireTrustProgramQualificationStageThirteenUser } from "../core";

export async function GET() { await requireTrustProgramQualificationStageThirteenUser(); return NextResponse.json(await findingsRequest()); }
export async function POST(request: Request) { await requireTrustProgramQualificationStageThirteenUser(); return NextResponse.json(await findingsRequest(request)); }
