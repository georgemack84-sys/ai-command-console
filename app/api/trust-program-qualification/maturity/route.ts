import { NextResponse } from "next/server";
import { maturityRequest, requireTrustProgramQualificationUser } from "../core";

export async function GET() { await requireTrustProgramQualificationUser(); return NextResponse.json(await maturityRequest()); }
export async function POST(request: Request) { await requireTrustProgramQualificationUser(); return NextResponse.json(await maturityRequest(request)); }
