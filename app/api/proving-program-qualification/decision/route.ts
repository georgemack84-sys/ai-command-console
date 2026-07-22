import { NextResponse } from "next/server";
import { decisionRequest, requireProgramQualificationUser } from "../core";
export async function GET() { await requireProgramQualificationUser(); return NextResponse.json(await decisionRequest()); }
export async function POST(request: Request) { await requireProgramQualificationUser(); return NextResponse.json(await decisionRequest(request)); }
