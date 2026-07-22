import { NextResponse } from "next/server";
import { requirePerformanceQualificationUser, scalabilityRequest } from "../core";
export async function GET() { await requirePerformanceQualificationUser(); return NextResponse.json(await scalabilityRequest()); }
export async function POST(request: Request) { await requirePerformanceQualificationUser(); return NextResponse.json(await scalabilityRequest(request)); }
