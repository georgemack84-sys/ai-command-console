import { NextResponse } from "next/server";
import { executionRequest, requirePerformanceQualificationUser } from "../core";
export async function GET() { await requirePerformanceQualificationUser(); return NextResponse.json(await executionRequest()); }
export async function POST(request: Request) { await requirePerformanceQualificationUser(); return NextResponse.json(await executionRequest(request)); }
