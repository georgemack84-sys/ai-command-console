import { NextResponse } from "next/server";
import { reportRequest, requireProgramQualificationUser } from "../core";
export async function GET() { await requireProgramQualificationUser(); return NextResponse.json(await reportRequest()); }
export async function POST(request: Request) { await requireProgramQualificationUser(); return NextResponse.json(await reportRequest(request)); }
