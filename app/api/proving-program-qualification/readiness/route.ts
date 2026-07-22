import { NextResponse } from "next/server";
import { readinessRequest, requireProgramQualificationUser } from "../core";
export async function GET() { await requireProgramQualificationUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireProgramQualificationUser(); return NextResponse.json(await readinessRequest(request)); }
