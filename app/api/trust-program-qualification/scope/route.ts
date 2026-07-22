import { NextResponse } from "next/server";
import { requireTrustProgramQualificationUser, scopeRequest } from "../core";

export async function GET() { await requireTrustProgramQualificationUser(); return NextResponse.json(await scopeRequest()); }
export async function POST(request: Request) { await requireTrustProgramQualificationUser(); return NextResponse.json(await scopeRequest(request)); }
