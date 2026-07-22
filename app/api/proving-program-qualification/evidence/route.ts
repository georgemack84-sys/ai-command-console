import { NextResponse } from "next/server";
import { evidenceRequest, requireProgramQualificationUser } from "../core";
export async function GET() { await requireProgramQualificationUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireProgramQualificationUser(); return NextResponse.json(await evidenceRequest(request)); }
