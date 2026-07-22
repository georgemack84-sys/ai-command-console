import { NextResponse } from "next/server";
import { capacityRequest, requirePerformanceQualificationUser } from "../core";
export async function GET() { await requirePerformanceQualificationUser(); return NextResponse.json(await capacityRequest()); }
export async function POST(request: Request) { await requirePerformanceQualificationUser(); return NextResponse.json(await capacityRequest(request)); }
