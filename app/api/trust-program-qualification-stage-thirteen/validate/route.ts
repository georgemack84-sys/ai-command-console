import { NextResponse } from "next/server";
import { requireTrustProgramQualificationStageThirteenUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireTrustProgramQualificationStageThirteenUser(); return NextResponse.json(await validateRequest(request)); }
