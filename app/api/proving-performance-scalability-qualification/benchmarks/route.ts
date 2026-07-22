import { NextResponse } from "next/server";
import { benchmarksRequest, requirePerformanceQualificationUser } from "../core";
export async function GET() { await requirePerformanceQualificationUser(); return NextResponse.json(await benchmarksRequest()); }
export async function POST(request: Request) { await requirePerformanceQualificationUser(); return NextResponse.json(await benchmarksRequest(request)); }
