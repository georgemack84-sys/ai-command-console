import { NextResponse } from "next/server";
import { approvalRequest, requireProgramQualificationUser } from "../core";
export async function GET() { await requireProgramQualificationUser(); return NextResponse.json(await approvalRequest()); }
export async function POST(request: Request) { await requireProgramQualificationUser(); return NextResponse.json(await approvalRequest(request)); }
