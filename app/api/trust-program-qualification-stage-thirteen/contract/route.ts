import { NextResponse } from "next/server";
import { contractResponse, requireTrustProgramQualificationStageThirteenUser } from "../core";

export async function GET() { await requireTrustProgramQualificationStageThirteenUser(); return NextResponse.json(contractResponse()); }
