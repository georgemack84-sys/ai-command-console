import { NextResponse } from "next/server";
import { crossProgramRequest, requireProgramQualificationUser } from "../core";
export async function GET() { await requireProgramQualificationUser(); return NextResponse.json(await crossProgramRequest()); }
export async function POST(request: Request) { await requireProgramQualificationUser(); return NextResponse.json(await crossProgramRequest(request)); }
