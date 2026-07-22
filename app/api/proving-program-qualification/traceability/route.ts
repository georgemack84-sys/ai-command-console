import { NextResponse } from "next/server";
import { requireProgramQualificationUser, traceabilityRequest } from "../core";
export async function GET() { await requireProgramQualificationUser(); return NextResponse.json(await traceabilityRequest()); }
export async function POST(request: Request) { await requireProgramQualificationUser(); return NextResponse.json(await traceabilityRequest(request)); }
