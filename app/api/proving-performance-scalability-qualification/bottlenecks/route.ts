import { NextResponse } from "next/server";
import { bottlenecksRequest, requirePerformanceQualificationUser } from "../core";
export async function GET() { await requirePerformanceQualificationUser(); return NextResponse.json(await bottlenecksRequest()); }
export async function POST(request: Request) { await requirePerformanceQualificationUser(); return NextResponse.json(await bottlenecksRequest(request)); }
