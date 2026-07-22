import { NextResponse } from "next/server";
import { readinessRequest, requireTrustProgramQualificationUser } from "../core";

export async function GET() { await requireTrustProgramQualificationUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireTrustProgramQualificationUser(); return NextResponse.json(await readinessRequest(request)); }
